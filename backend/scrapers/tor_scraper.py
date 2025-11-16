"""
Tor Scraper for Project NEXT Intelligence
Connects to onion sites via Tor SOCKS proxy
"""

import requests
import logging
from typing import Optional, Dict
from bs4 import BeautifulSoup
import time

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TOR_PROXY, REQUEST_DELAY, LOG_FILE

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


class TorScraper:
    """Scraper for Tor hidden services (.onion sites)"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.proxies = TOR_PROXY
        self.is_connected = False
    
    def test_tor_connection(self) -> bool:
        """
        Test if Tor connection is working
        
        Returns:
            bool: True if Tor is accessible, False otherwise
        """
        try:
            logger.info("Testing Tor connection...")
            
            # Try to connect to Tor check service
            response = self.session.get(
                'https://check.torproject.org/',
                timeout=30
            )
            
            if 'Congratulations' in response.text:
                logger.info("✓ Successfully connected to Tor network")
                self.is_connected = True
                return True
            else:
                logger.warning("⚠ Connected but not using Tor")
                self.is_connected = False
                return False
                
        except requests.exceptions.ConnectionError as e:
            logger.error(f"✗ Cannot connect to Tor proxy: {e}")
            logger.error("Make sure Tor service is running on localhost:9050")
            self.is_connected = False
            return False
        except Exception as e:
            logger.error(f"✗ Error testing Tor connection: {e}")
            self.is_connected = False
            return False
    
    def fetch_onion_site(self, url: str, timeout: int = 60) -> Optional[Dict]:
        """
        Fetch content from an onion site
        
        Args:
            url: The .onion URL to fetch
            timeout: Request timeout in seconds
            
        Returns:
            Dict with status, content, and error info or None if failed
        """
        if not self.is_connected:
            logger.warning("Tor connection not established, testing connection...")
            if not self.test_tor_connection():
                return {
                    'status': 'error',
                    'url': url,
                    'error': 'Tor connection not available'
                }
        
        try:
            logger.info(f"Fetching onion site: {url}")
            
            response = self.session.get(
                url,
                timeout=timeout,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0'
                }
            )
            
            response.raise_for_status()
            
            # Parse content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            result = {
                'status': 'success',
                'url': url,
                'content': response.text,
                'title': soup.title.string if soup.title else 'No title',
                'text': soup.get_text(),
                'status_code': response.status_code
            }
            
            logger.info(f"✓ Successfully fetched {url}")
            time.sleep(REQUEST_DELAY)  # Rate limiting
            
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"✗ Timeout fetching {url}")
            return {
                'status': 'error',
                'url': url,
                'error': 'Request timeout'
            }
        except requests.exceptions.ConnectionError as e:
            logger.error(f"✗ Connection error fetching {url}: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': f'Connection error: {str(e)}'
            }
        except requests.exceptions.HTTPError as e:
            logger.error(f"✗ HTTP error fetching {url}: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': f'HTTP error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"✗ Unexpected error fetching {url}: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': f'Unexpected error: {str(e)}'
            }
    
    def search_onion_pastes(self, query: str, paste_sites: list) -> list:
        """
        Search for pastes on onion paste sites
        
        Args:
            query: Search query (e.g., domain name)
            paste_sites: List of onion paste site URLs
            
        Returns:
            List of found paste results
        """
        results = []
        
        for site in paste_sites:
            try:
                logger.info(f"Searching {site} for: {query}")
                
                # Fetch the site
                site_data = self.fetch_onion_site(site)
                
                if site_data and site_data['status'] == 'success':
                    # Check if query appears in content
                    if query.lower() in site_data['text'].lower():
                        results.append({
                            'url': site,
                            'title': site_data['title'],
                            'source': 'darknet',
                            'found_query': True
                        })
                        logger.info(f"✓ Found match on {site}")
                    else:
                        logger.info(f"No match found on {site}")
                else:
                    logger.warning(f"Failed to fetch {site}")
                    
            except Exception as e:
                logger.error(f"Error searching {site}: {e}")
                continue
        
        return results
