"""
Selenium Scraper for Project NEXT Intelligence
Handles dynamic content and JavaScript-heavy sites
"""

import logging
import time
from typing import Optional, Dict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import REQUEST_DELAY, LOG_FILE

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


class SeleniumScraper:
    """Selenium-based scraper for dynamic content"""
    
    def __init__(self, browser: str = "chrome", headless: bool = True):
        """
        Initialize Selenium scraper
        
        Args:
            browser: Browser to use ("chrome" or "edge")
            headless: Whether to run in headless mode
        """
        self.browser = browser
        self.headless = headless
        self.driver = None
        self._init_driver()
    
    def _init_driver(self):
        """Initialize the WebDriver"""
        try:
            if self.browser.lower() == "chrome":
                options = ChromeOptions()
                if self.headless:
                    options.add_argument('--headless=new')
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
                options.add_argument('--disable-gpu')
                options.add_argument('--window-size=1920,1080')
                options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                
                self.driver = webdriver.Chrome(options=options)
                logger.info("✓ Chrome WebDriver initialized")
                
            elif self.browser.lower() == "edge":
                options = EdgeOptions()
                if self.headless:
                    options.add_argument('--headless')
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
                options.add_argument('--disable-gpu')
                options.add_argument('--window-size=1920,1080')
                
                self.driver = webdriver.Edge(options=options)
                logger.info("✓ Edge WebDriver initialized")
            else:
                raise ValueError(f"Unsupported browser: {self.browser}")
                
        except WebDriverException as e:
            logger.error(f"✗ Failed to initialize WebDriver: {e}")
            logger.error("Make sure ChromeDriver or EdgeDriver is installed and in PATH")
            raise
    
    def scrape_dynamic_content(self, url: str, wait_for_selector: str = None, 
                               timeout: int = 10) -> Optional[Dict]:
        """
        Scrape content from a dynamic website
        
        Args:
            url: URL to scrape
            wait_for_selector: CSS selector to wait for before scraping
            timeout: Maximum time to wait for page load
            
        Returns:
            Dict with page content and metadata or None if failed
        """
        if not self.driver:
            logger.error("WebDriver not initialized")
            return None
        
        try:
            logger.info(f"Scraping dynamic content from: {url}")
            
            # Navigate to URL
            self.driver.get(url)
            
            # Wait for specific element if provided
            if wait_for_selector:
                try:
                    WebDriverWait(self.driver, timeout).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector))
                    )
                    logger.info(f"✓ Found selector: {wait_for_selector}")
                except TimeoutException:
                    logger.warning(f"⚠ Timeout waiting for selector: {wait_for_selector}")
            else:
                # Default wait for body
                time.sleep(2)
            
            # Extract page content
            result = {
                'status': 'success',
                'url': url,
                'title': self.driver.title,
                'html': self.driver.page_source,
                'text': self.driver.find_element(By.TAG_NAME, 'body').text,
                'current_url': self.driver.current_url
            }
            
            logger.info(f"✓ Successfully scraped {url}")
            time.sleep(REQUEST_DELAY)  # Rate limiting
            
            return result
            
        except WebDriverException as e:
            logger.error(f"✗ WebDriver error scraping {url}: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"✗ Unexpected error scraping {url}: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': str(e)
            }
    
    def screenshot_page(self, url: str, output_path: str) -> bool:
        """
        Take a screenshot of a page
        
        Args:
            url: URL to screenshot
            output_path: Path to save screenshot
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.driver:
            logger.error("WebDriver not initialized")
            return False
        
        try:
            logger.info(f"Taking screenshot of: {url}")
            
            self.driver.get(url)
            time.sleep(2)  # Wait for page load
            
            self.driver.save_screenshot(output_path)
            
            logger.info(f"✓ Screenshot saved to: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Failed to take screenshot: {e}")
            return False
    
    def get_element_text(self, url: str, selector: str, 
                        by: By = By.CSS_SELECTOR) -> Optional[str]:
        """
        Get text from a specific element
        
        Args:
            url: URL to visit
            selector: Element selector
            by: Selection method (default CSS_SELECTOR)
            
        Returns:
            Element text or None if not found
        """
        if not self.driver:
            logger.error("WebDriver not initialized")
            return None
        
        try:
            self.driver.get(url)
            
            element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((by, selector))
            )
            
            return element.text
            
        except TimeoutException:
            logger.warning(f"Element not found: {selector}")
            return None
        except Exception as e:
            logger.error(f"Error getting element text: {e}")
            return None
    
    def close(self):
        """Close the WebDriver and cleanup"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("✓ WebDriver closed")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {e}")
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()
    
    def __del__(self):
        """Destructor to ensure cleanup"""
        self.close()
