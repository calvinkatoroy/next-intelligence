# pytest configuration for Next Intelligence testing

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_config():
    """Test configuration"""
    return {
        "backend_url": "http://localhost:8000",
        "tor_proxy": "socks5h://localhost:9050",
        "test_mode": True,
        "log_level": "DEBUG"
    }


@pytest.fixture
def mock_paste_data():
    """Mock paste site data"""
    return {
        "id": "test123",
        "title": "Test Paste",
        "content": "Leaked data from example.com with admin@example.com",
        "author": "testuser",
        "date": "2025-11-17",
        "url": "https://pastebin.com/test123"
    }


def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "performance: marks tests as performance tests"
    )
    config.addinivalue_line(
        "markers", "security: marks tests as security tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )
