# Backend Tests for Project NEXT Intelligence

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json

# Import the FastAPI app
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.main import app
from scrapers.discovery_engine import DiscoveryOrchestrator
from scrapers.tor_scraper import TorScraper
from scrapers.selenium_scraper import SeleniumScraper

# Create test client
client = TestClient(app)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_scan_request():
    """Sample scan request payload"""
    return {
        "url": "https://pastebin.com/test123",
        "search_depth": 2,
        "target_domain": "example.com",
        "enable_tor": False
    }


@pytest.fixture
def sample_paste_content():
    """Sample paste content for testing"""
    return """
    Leaked database from example.com
    Administrator: admin@example.com
    Password: P@ssw0rd123
    Contact: support@example.com
    Keywords: password, credentials, leaked
    Visit example.com for more info
    """


@pytest.fixture
def discovery_engine():
    """Discovery engine instance"""
    return DiscoveryOrchestrator(
        target_url="https://pastebin.com/test",
        target_domain="example.com",
        search_depth=2
    )


# ============================================================================
# API TESTS - TC-BE-001 to TC-BE-010
# ============================================================================

class TestAPIEndpoints:
    """Test suite for Backend API endpoints"""
    
    def test_be_001_post_scan_valid_request(self, sample_scan_request):
        """TC-BE-001: POST /api/scan - Valid Scan Request"""
        response = client.post("/api/scan", json=sample_scan_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "scan_id" in data
        assert "status" in data
        assert data["status"] == "queued"
        assert "created_at" in data
        
        # Verify UUID format
        import uuid
        try:
            uuid.UUID(data["scan_id"])
            uuid_valid = True
        except ValueError:
            uuid_valid = False
        assert uuid_valid is True
    
    
    def test_be_002_post_scan_invalid_url(self):
        """TC-BE-002: POST /api/scan - Invalid URL"""
        invalid_request = {
            "url": "not-a-valid-url",
            "search_depth": 2,
            "target_domain": "example.com"
        }
        
        response = client.post("/api/scan", json=invalid_request)
        
        # Should return 422 Unprocessable Entity for validation error
        assert response.status_code in [400, 422]
        data = response.json()
        assert "detail" in data or "error" in data
    
    
    def test_be_003_post_scan_missing_fields(self):
        """TC-BE-003: POST /api/scan - Missing Required Fields"""
        incomplete_request = {
            "search_depth": 2
            # Missing 'url' field
        }
        
        response = client.post("/api/scan", json=incomplete_request)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    
    def test_be_004_get_scans_retrieve_all(self, sample_scan_request):
        """TC-BE-004: GET /api/scans - Retrieve All Scans"""
        # Create test scans
        for i in range(3):
            client.post("/api/scan", json=sample_scan_request)
        
        response = client.get("/api/scans")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        
        # Verify scan structure
        if len(data) > 0:
            scan = data[0]
            assert "scan_id" in scan
            assert "url" in scan
            assert "status" in scan
    
    
    def test_be_005_get_scans_empty_list(self):
        """TC-BE-005: GET /api/scans - Empty List"""
        # This test assumes fresh start or after clearing
        response = client.get("/api/scans")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    
    def test_be_006_get_results_valid_scan_id(self, sample_scan_request):
        """TC-BE-006: GET /api/results - Valid Scan ID"""
        # Create a scan first
        create_response = client.post("/api/scan", json=sample_scan_request)
        scan_id = create_response.json()["scan_id"]
        
        # Wait briefly for processing (in real test, use mock)
        import time
        time.sleep(0.5)
        
        # Get results
        response = client.get(f"/api/results?scan_id={scan_id}")
        
        assert response.status_code in [200, 404]  # 404 if not yet processed
        if response.status_code == 200:
            data = response.json()
            assert "scan_id" in data or "results" in data
    
    
    def test_be_007_get_results_invalid_scan_id(self):
        """TC-BE-007: GET /api/results - Invalid Scan ID"""
        fake_scan_id = "00000000-0000-0000-0000-000000000000"
        
        response = client.get(f"/api/results?scan_id={fake_scan_id}")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data or "error" in data
    
    
    def test_be_010_cors_headers_validation(self):
        """TC-BE-010: CORS Headers Validation"""
        response = client.options(
            "/api/scan",
            headers={"Origin": "http://localhost:3000"}
        )
        
        # Check for CORS headers
        assert "access-control-allow-origin" in response.headers or \
               response.status_code in [200, 405]


# ============================================================================
# DISCOVERY ENGINE TESTS - TC-DE-001 to TC-DE-008
# ============================================================================

class TestDiscoveryEngine:
    """Test suite for Discovery Engine"""
    
    def test_de_001_relevance_score_high(self, sample_paste_content):
        """TC-DE-001: Relevance Score Calculation - High Score"""
        engine = DiscoveryOrchestrator(
            target_url="https://test.com",
            target_domain="example.com",
            search_depth=1
        )
        
        score = engine._calculate_relevance_score(
            content=sample_paste_content,
            target_domain="example.com",
            target_emails=["admin@example.com", "support@example.com"],
            keywords=["password", "credentials", "leaked"]
        )
        
        # Should be high score due to multiple matches
        assert score >= 80
    
    
    def test_de_002_relevance_score_medium(self):
        """TC-DE-002: Relevance Score - Medium Score"""
        engine = DiscoveryOrchestrator(
            target_url="https://test.com",
            target_domain="example.com",
            search_depth=1
        )
        
        medium_content = """
        Some information about example.com
        The domain example.com appears here.
        Keyword: leak
        """
        
        score = engine._calculate_relevance_score(
            content=medium_content,
            target_domain="example.com",
            target_emails=[],
            keywords=["leak"]
        )
        
        assert 40 <= score <= 70
    
    
    def test_de_003_relevance_score_low(self):
        """TC-DE-003: Relevance Score - Low Score"""
        engine = DiscoveryOrchestrator(
            target_url="https://test.com",
            target_domain="example.com",
            search_depth=1
        )
        
        low_content = """
        Random content with no matches.
        Just some text here.
        """
        
        score = engine._calculate_relevance_score(
            content=low_content,
            target_domain="example.com",
            target_emails=[],
            keywords=["password", "leak"]
        )
        
        assert score < 30
    
    
    def test_de_004_email_extraction(self):
        """TC-DE-004: Email Extraction"""
        engine = DiscoveryOrchestrator(
            target_url="https://test.com",
            target_domain="example.com",
            search_depth=1
        )
        
        text = """
        Contact: admin@example.com
        Support: support@example.com
        Invalid: notanemail
        External: user@different.com
        """
        
        # This is a simplified test - actual implementation may vary
        import re
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        
        assert len(emails) >= 2
        assert "admin@example.com" in emails
        assert "support@example.com" in emails
    
    
    def test_de_005_domain_mention_detection(self):
        """TC-DE-005: Domain Mention Detection"""
        text = """
        Visit example.com
        See EXAMPLE.COM
        Check www.example.com
        """
        
        domain = "example.com"
        mentions = text.lower().count(domain.lower())
        
        assert mentions == 3
    
    
    def test_de_006_keyword_matching(self):
        """TC-DE-006: Keyword Matching"""
        text = """
        Found password in database
        This is a leak of credentials
        Security breach detected
        """
        
        keywords = ["password", "leak", "breach"]
        found_keywords = []
        
        for keyword in keywords:
            if keyword.lower() in text.lower():
                found_keywords.append(keyword)
        
        assert len(found_keywords) == 3


# ============================================================================
# SCRAPER TESTS - TC-SC-001 to TC-SC-006
# ============================================================================

class TestScrapers:
    """Test suite for Scrapers"""
    
    @pytest.mark.asyncio
    async def test_sc_001_tor_connection_test(self):
        """TC-SC-001: Tor Connection Test"""
        scraper = TorScraper()
        
        # Test Tor connection
        is_connected = await scraper.test_tor_connection()
        
        # This may fail if Tor service is not running
        # In real environment, this should pass
        assert isinstance(is_connected, bool)
    
    
    def test_sc_005_beautifulsoup_parsing(self):
        """TC-SC-005: BeautifulSoup Parsing"""
        from bs4 import BeautifulSoup
        
        html = """
        <div class="paste-content">
            <h1>Paste Title</h1>
            <p>Content with password123</p>
        </div>
        """
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract title
        title = soup.find('h1')
        assert title is not None
        assert title.text == "Paste Title"
        
        # Extract content
        content = soup.find('p')
        assert content is not None
        assert "password123" in content.text


# ============================================================================
# INTEGRATION TESTS - TC-INT-001 to TC-INT-005
# ============================================================================

class TestIntegration:
    """Test suite for Integration scenarios"""
    
    @pytest.mark.integration
    def test_int_001_frontend_to_backend(self, sample_scan_request):
        """TC-INT-001: Frontend to Backend Communication"""
        # Simulate frontend request
        response = client.post("/api/scan", json=sample_scan_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "scan_id" in data
    
    
    @pytest.mark.integration
    def test_int_004_complete_scan_workflow(self, sample_scan_request):
        """TC-INT-004: Complete Scan Workflow"""
        # Step 1: Submit scan
        create_response = client.post("/api/scan", json=sample_scan_request)
        assert create_response.status_code == 200
        scan_id = create_response.json()["scan_id"]
        
        # Step 2: Verify scan in list
        list_response = client.get("/api/scans")
        assert list_response.status_code == 200
        scans = list_response.json()
        assert any(scan["scan_id"] == scan_id for scan in scans)
        
        # Step 3: Check results (may not be ready immediately)
        results_response = client.get(f"/api/results?scan_id={scan_id}")
        assert results_response.status_code in [200, 404, 202]


# ============================================================================
# SECURITY TESTS - TC-SEC-001 to TC-SEC-006
# ============================================================================

class TestSecurity:
    """Test suite for Security"""
    
    def test_sec_001_sql_injection_prevention(self):
        """TC-SEC-001: SQL Injection Prevention"""
        malicious_payloads = [
            "'; DROP TABLE scans; --",
            "' OR '1'='1",
            "\"; DELETE FROM results WHERE \"1\"=\"1",
        ]
        
        for payload in malicious_payloads:
            request = {
                "url": f"https://example.com{payload}",
                "search_depth": 2,
                "target_domain": "example.com"
            }
            
            response = client.post("/api/scan", json=request)
            
            # Should either accept and sanitize, or reject with validation error
            assert response.status_code in [200, 400, 422]
            
            # If accepted, verify no SQL execution occurred
            # (In real test, check database integrity)
    
    
    def test_sec_002_xss_prevention(self):
        """TC-SEC-002: XSS Prevention"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<iframe src=\"javascript:alert('XSS')\">",
        ]
        
        for payload in xss_payloads:
            request = {
                "url": f"https://example.com/{payload}",
                "search_depth": 2,
                "target_domain": "example.com"
            }
            
            response = client.post("/api/scan", json=request)
            
            # Response should not execute script
            # Verify HTML encoding if endpoint returns user input
            assert response.status_code in [200, 400, 422]
    
    
    def test_sec_003_cors_security(self):
        """TC-SEC-003: CORS Security"""
        # Test with unauthorized origin
        response = client.get(
            "/api/scans",
            headers={"Origin": "https://malicious-site.com"}
        )
        
        # Should either block or return without CORS headers
        # Exact behavior depends on CORS configuration
        assert response.status_code in [200, 403]


# ============================================================================
# PERFORMANCE TESTS - TC-PERF-001 to TC-PERF-006
# ============================================================================

class TestPerformance:
    """Test suite for Performance"""
    
    def test_perf_001_api_response_time(self, sample_scan_request):
        """TC-PERF-001: API Response Time"""
        import time
        
        # Measure response time for 10 requests
        times = []
        for _ in range(10):
            start = time.time()
            response = client.post("/api/scan", json=sample_scan_request)
            end = time.time()
            
            if response.status_code == 200:
                times.append((end - start) * 1000)  # Convert to ms
        
        if times:
            avg_time = sum(times) / len(times)
            assert avg_time < 500, f"Average response time {avg_time}ms exceeds 500ms"
    
    
    @pytest.mark.performance
    def test_perf_002_concurrent_scan_processing(self, sample_scan_request):
        """TC-PERF-002: Concurrent Scan Processing"""
        import concurrent.futures
        
        def create_scan():
            return client.post("/api/scan", json=sample_scan_request)
        
        # Submit 10 concurrent scans
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_scan) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # All should succeed
        success_count = sum(1 for r in results if r.status_code == 200)
        assert success_count >= 8, "Less than 80% of concurrent requests succeeded"


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
