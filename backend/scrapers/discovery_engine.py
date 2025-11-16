"""
Discovery Engine for Project NEXT Intelligence
Combines clearnet paste site scraping with relevance scoring
Adapted from project_discovery-main module
"""

import requests
from bs4 import BeautifulSoup
import time
import logging
import re
import random
from typing import List, Dict, Optional, Set
from urllib.parse import urljoin, urlparse
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import (
    TARGET_DOMAIN, REQUEST_DELAY, MAX_RETRIES,
    MIN_RELEVANCE_SCORE, LEAK_KEYWORDS, USER_AGENTS,
    CLEARNET_SOURCES, LOG_FILE
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class DiscoveryOrchestrator:
    """Main orchestrator for clearnet discovery with relevance scoring"""
    
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        self.visited_urls = set()
    
    def _get_random_user_agent(self) -> str:
        """Return a random user agent string"""
        return random.choice(USER_AGENTS)
    
    def _make_request(self, url: str, retries: int = MAX_RETRIES) -> Optional[requests.Response]:
        """Make HTTP request with retry logic"""
        headers = {'User-Agent': self._get_random_user_agent()}
        
        for attempt in range(retries):
            try:
                response = self.session.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                time.sleep(REQUEST_DELAY)  # Rate limiting
                return response
            except requests.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{retries}): {url} - {str(e)}")
                if attempt < retries - 1:
                    time.sleep(REQUEST_DELAY * 2)
                else:
                    logger.error(f"Failed to fetch {url} after {retries} attempts")
        return None
    
    def _calculate_relevance_score(self, text: str, title: str = "") -> float:
        """
        Calculate relevance score based on keyword presence and domain mentions
        
        Scoring algorithm:
        - Domain mentions: 40% (0.4)
        - Target domain emails: 30% (0.3)
        - Leak keywords: 30% (0.3)
        
        Args:
            text: The content text to analyze
            title: The title of the paste (optional)
            
        Returns:
            float: Relevance score between 0 and 1
        """
        score = 0.0
        text_lower = text.lower()
        title_lower = title.lower()
        
        # Check for target domain (40% weight)
        domain_mentions = len(re.findall(re.escape(TARGET_DOMAIN), text_lower))
        if domain_mentions > 0:
            score += min(0.4, domain_mentions * 0.1)
        
        # Check for email addresses with target domain (30% weight)
        email_pattern = rf'\b[\w\.-]+@{re.escape(TARGET_DOMAIN)}\b'
        email_matches = len(re.findall(email_pattern, text_lower))
        if email_matches > 0:
            score += min(0.3, email_matches * 0.05)
        
        # Check for leak keywords (30% weight)
        keyword_matches = sum(1 for keyword in LEAK_KEYWORDS if keyword in text_lower or keyword in title_lower)
        if keyword_matches > 0:
            score += min(0.3, keyword_matches * 0.03)
        
        return min(1.0, score)
    
    def _extract_emails(self, text: str) -> Set[str]:
        """Extract email addresses from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return set(re.findall(email_pattern, text))
    
    def _extract_target_domain_emails(self, text: str) -> Set[str]:
        """Extract email addresses specifically from the target domain"""
        email_pattern = rf'\b[\w\.-]+@{re.escape(TARGET_DOMAIN)}\b'
        return set(re.findall(email_pattern, text, re.IGNORECASE))
    
    def _contains_credentials(self, text: str) -> bool:
        """
        Check if text likely contains credentials (username:password format)
        """
        # Common credential patterns
        patterns = [
            r'\b\w+:\w+\b',  # username:password
            r'username[:\s]+\w+',  # username: xyz
            r'password[:\s]+\w+',  # password: xyz
            r'email[:\s]+[\w\.-]+@[\w\.-]+',  # email: xyz@abc.com
        ]
        
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _get_raw_url(self, paste_url: str) -> Optional[str]:
        """Convert paste URL to raw content URL"""
        if 'pastebin.com' in paste_url:
            paste_id = paste_url.split('/')[-1]
            return f"https://pastebin.com/raw/{paste_id}"
        elif 'paste.ee' in paste_url:
            return paste_url.replace('/p/', '/r/')
        elif 'ghostbin.com' in paste_url:
            return paste_url + '/raw'
        else:
            return paste_url
    
    def _extract_paste_metadata(self, paste_url: str) -> Dict:
        """Extract metadata from paste page"""
        response = self._make_request(paste_url)
        if not response:
            return {}
        
        soup = BeautifulSoup(response.text, 'html.parser')
        metadata = {}
        
        if 'pastebin.com' in paste_url:
            # Extract Pastebin metadata
            title_elem = soup.find('div', class_='info-top')
            if title_elem:
                metadata['title'] = title_elem.get_text(strip=True)
            
            # Find author
            author_elem = soup.find('div', class_='username')
            if author_elem:
                author_link = author_elem.find('a')
                if author_link:
                    metadata['author'] = author_link.get_text(strip=True)
                    metadata['author_url'] = urljoin(paste_url, author_link.get('href', ''))
            
            # Find timestamp
            date_elem = soup.find('div', class_='date')
            if date_elem:
                metadata['timestamp'] = date_elem.get_text(strip=True)
        
        return metadata
    
    def analyze_paste(self, paste_url: str) -> Optional[Dict]:
        """
        Analyze a single paste for relevant content
        
        Args:
            paste_url: URL of the paste to analyze
            
        Returns:
            Dict with analysis results or None if not relevant
        """
        if paste_url in self.visited_urls:
            logger.info(f"Already visited: {paste_url}")
            return None
        
        self.visited_urls.add(paste_url)
        logger.info(f"Analyzing paste: {paste_url}")
        
        # Get raw paste content
        raw_url = self._get_raw_url(paste_url)
        if not raw_url:
            return None
        
        response = self._make_request(raw_url)
        if not response:
            return None
        
        # Extract content
        content = response.text
        
        # Get paste metadata
        metadata = self._extract_paste_metadata(paste_url)
        
        # Calculate relevance
        relevance_score = self._calculate_relevance_score(
            content, 
            metadata.get('title', '')
        )
        
        if relevance_score < MIN_RELEVANCE_SCORE:
            logger.info(f"Low relevance score ({relevance_score:.2f}), skipping")
            return None
        
        # Extract information
        all_emails = self._extract_emails(content)
        target_emails = self._extract_target_domain_emails(content)
        has_creds = self._contains_credentials(content)
        
        result = {
            'url': paste_url.strip(),
            'source': 'pastebin' if 'pastebin.com' in paste_url else 'clearnet',
            'title': metadata.get('title', 'Unknown'),
            'author': metadata.get('author', 'Unknown'),
            'timestamp': metadata.get('timestamp', datetime.now().isoformat()),
            'relevance_score': round(relevance_score, 2),
            'emails': list(all_emails),
            'target_emails': list(target_emails),
            'has_credentials': has_creds,
            'content_preview': content[:500] if content else ''
        }
        
        logger.info(f"✓ Found relevant paste! Score: {relevance_score:.2f}")
        logger.info(f"  Target emails: {len(target_emails)}, All emails: {len(all_emails)}")
        
        return result
    
    def crawl_user_pastes(self, username: str, base_url: str = "https://pastebin.com") -> List[Dict]:
        """
        Crawl all pastes from a specific user
        
        Args:
            username: Username to crawl
            base_url: Base URL of the paste site
            
        Returns:
            List of relevant pastes from this user
        """
        logger.info(f"Crawling pastes from user: {username}")
        
        user_url = f"{base_url}/u/{username}"
        response = self._make_request(user_url)
        
        if not response:
            logger.error(f"Failed to fetch user page: {user_url}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        user_results = []
        
        # Find all paste links on the user's page
        paste_links = soup.find_all('a', href=re.compile(r'^/[A-Za-z0-9]{8}$'))
        
        logger.info(f"Found {len(paste_links)} pastes from user {username}")
        
        for link in paste_links[:10]:  # Limit to 10 pastes per user
            paste_id = link.get('href', '').strip('/')
            if not paste_id:
                continue
            
            paste_url = f"{base_url}/{paste_id}"
            
            # Analyze each paste
            result = self.analyze_paste(paste_url)
            if result:
                user_results.append(result)
        
        logger.info(f"Found {len(user_results)} relevant pastes from {username}")
        return user_results
    
    def run_full_discovery(self, 
                          clearnet_urls: List[str] = None,
                          enable_clearnet: bool = True,
                          enable_darknet: bool = False,
                          crawl_authors: bool = True) -> Dict:
        """
        Run complete discovery across clearnet
        
        Args:
            clearnet_urls: Initial clearnet paste URLs
            enable_clearnet: Whether to run clearnet discovery
            enable_darknet: Whether to run darknet discovery (not implemented)
            crawl_authors: Whether to crawl paste authors' profiles
            
        Returns:
            Dictionary with all results and metadata
        """
        logger.info("="*70)
        logger.info("PROJECT NEXT INTELLIGENCE - DISCOVERY MODULE")
        logger.info(f"Target Domain: {TARGET_DOMAIN}")
        logger.info(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("="*70)
        
        all_results = []
        authors_to_crawl = set()
        
        # Run clearnet discovery
        if enable_clearnet and clearnet_urls:
            try:
                # Analyze provided URLs
                for url in clearnet_urls:
                    result = self.analyze_paste(url)
                    if result:
                        all_results.append(result)
                        
                        # Collect authors for crawling
                        if crawl_authors and result.get('author') and result['author'] != 'Unknown':
                            authors_to_crawl.add(result['author'])
                
                # Crawl identified authors
                if crawl_authors and authors_to_crawl:
                    logger.info(f"\nCrawling {len(authors_to_crawl)} identified authors...")
                    for author in authors_to_crawl:
                        author_results = self.crawl_user_pastes(author)
                        all_results.extend(author_results)
                
            except Exception as e:
                logger.error(f"Clearnet discovery failed: {str(e)}")
        
        # Sort by relevance score
        all_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Generate summary
        high_priority_count = sum(1 for r in all_results if r['relevance_score'] >= 0.7)
        total_target_emails = sum(len(r['target_emails']) for r in all_results)
        creds_count = sum(1 for r in all_results if r['has_credentials'])
        
        summary = {
            'total_results': len(all_results),
            'high_priority_count': high_priority_count,
            'total_target_emails': total_target_emails,
            'credentials_found': creds_count
        }
        
        # Package results
        output = {
            'metadata': {
                'target_domain': TARGET_DOMAIN,
                'timestamp': datetime.now().isoformat(),
                'total_results': len(all_results),
                'clearnet_results': len(all_results),
                'darknet_results': 0
            },
            'summary': summary,
            'results': all_results
        }
        
        self.results = all_results
        
        logger.info("\n" + "="*70)
        logger.info("DISCOVERY COMPLETE")
        logger.info(f"Total relevant items found: {len(all_results)}")
        logger.info(f"High priority items: {high_priority_count}")
        logger.info(f"Total target domain emails: {total_target_emails}")
        logger.info("="*70 + "\n")
        
        return output
