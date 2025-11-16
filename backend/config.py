"""
Configuration file for Project NEXT Intelligence Backend
Load settings from environment variables with defaults
"""

import os
from pathlib import Path
from typing import List

# Base directory
BASE_DIR = Path(__file__).parent.absolute()

# Target domain to search for
TARGET_DOMAIN = os.getenv("TARGET_DOMAIN", "ui.ac.id")

# Relevance scoring thresholds
MIN_RELEVANCE_SCORE = float(os.getenv("MIN_RELEVANCE_SCORE", "0.3"))
HIGH_PRIORITY_SCORE = float(os.getenv("HIGH_PRIORITY_SCORE", "0.7"))

# Rate limiting (seconds between requests)
REQUEST_DELAY = float(os.getenv("REQUEST_DELAY", "2"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# Tor configuration
TOR_PROXY = {
    'http': os.getenv("TOR_PROXY_HTTP", "socks5h://localhost:9050"),
    'https': os.getenv("TOR_PROXY_HTTPS", "socks5h://localhost:9050")
}

# Clearnet paste sites to search
CLEARNET_SOURCES = [
    "pastebin.com",
    "paste.ee",
    "ghostbin.com",
    "privatebin.net",
    "justpaste.it",
    "hastebin.com"
]

# Keywords to identify potential leaks (Indonesian and English)
LEAK_KEYWORDS = [
    # English keywords
    "password", "passwd", "pwd", "credential", "login", "auth",
    "email", "username", "database", "db", "leak", "breach",
    "dump", "hack", "hacked", "data", "employee", "student", "staff",
    "account", "accounts", "user", "users", "admin",
    # Indonesian keywords
    "mahasiswa", "dosen", "karyawan", "akun", "sandi", "kata sandi",
    "pengguna", "data", "bocor", "kebocoran"
]

# User-Agent rotation for web scraping
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
]

# Known darknet paste sites (examples - may not be active)
DARKNET_SOURCES = [
    "http://nzxj65x32vh2fkhk.onion",  # Stronghold Paste (example)
    "http://thehiddenwiki.onion",     # Hidden Wiki (example)
]

# Output configuration
OUTPUT_DIR = BASE_DIR / "scan_results"
LOG_FILE = BASE_DIR / "discovery.log"

# Create directories if they don't exist
OUTPUT_DIR.mkdir(exist_ok=True)

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:80",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

# Convert Path objects to strings for compatibility
OUTPUT_DIR = str(OUTPUT_DIR)
LOG_FILE = str(LOG_FILE)
