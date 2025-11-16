# Project NEXT Intelligence - Complete File Structure

```
next-intelligence/
│
├── README.md                           # Comprehensive project documentation
├── .gitignore                         # Git ignore patterns
├── .env.example                       # Environment variables template
├── docker-compose.yml                 # Docker orchestration configuration
├── start.ps1                          # Quick start script (Windows PowerShell)
├── stop.ps1                           # Stop services script (Windows PowerShell)
│
├── backend/                           # Python FastAPI Backend
│   ├── api/
│   │   ├── __init__.py               # API module init
│   │   └── main.py                    # FastAPI app with REST & WebSocket endpoints
│   │
│   ├── scrapers/
│   │   ├── __init__.py               # Scrapers module init
│   │   ├── discovery_engine.py        # Main discovery orchestrator
│   │   ├── tor_scraper.py            # Tor/darknet scraper
│   │   └── selenium_scraper.py       # Dynamic content scraper
│   │
│   ├── config.py                      # Configuration management
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend container definition
│   └── scan_results/                  # Directory for scan outputs (created at runtime)
│
├── frontend/                          # React TypeScript Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # API client with WebSocket support
│   │   │
│   │   ├── components/
│   │   │   ├── Dashboard.tsx          # Main dashboard component
│   │   │   ├── ScanForm.tsx          # Scan submission form
│   │   │   ├── ResultsList.tsx       # Results display table
│   │   │   └── ui/                    # Reusable UI components from NextFE-master
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── label.tsx
│   │   │       ├── table.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── sonner.tsx
│   │   │       └── ... (other UI components)
│   │   │
│   │   ├── hooks/
│   │   │   └── useScan.ts            # Custom scan management hook
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
│   │   │
│   │   ├── App.tsx                    # Main application component
│   │   ├── main.tsx                   # Application entry point
│   │   └── index.css                  # Global styles
│   │
│   ├── index.html                     # HTML template
│   ├── package.json                   # Node.js dependencies & scripts
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── tsconfig.node.json            # TypeScript config for Node
│   ├── vite.config.ts                # Vite build configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   ├── nginx.conf                     # Nginx configuration for production
│   └── Dockerfile                     # Frontend container definition
│
├── project_discovery-main/           # Original discovery module (reference)
│   ├── discovery_module.py
│   ├── clearnet_discovery.py
│   ├── darknet_discovery.py
│   ├── config.py
│   ├── utils.py
│   └── ...
│
├── PJNextScraper-master/             # Original Tor scraper (reference)
│   ├── main.py
│   ├── scrape.py
│   └── ...
│
└── NextFE-master/                    # Original frontend (reference)
    ├── src/
    │   ├── components/
    │   └── ...
    └── ...
```

## Key Components

### Backend Architecture

1. **api/main.py** (FastAPI Application)
   - REST endpoints: `/api/scan`, `/api/scans`, `/api/scans/{id}`, `/api/results/{id}`
   - WebSocket endpoint: `/ws`
   - Background task management for async scanning
   - In-memory storage for scans and results
   - CORS configuration for frontend access

2. **scrapers/discovery_engine.py** (Discovery Orchestrator)
   - DiscoveryOrchestrator class
   - Paste site scraping (Pastebin, Paste.ee, etc.)
   - Relevance scoring algorithm (domain mentions 40%, emails 30%, keywords 30%)
   - Author profile crawling
   - Email and credential extraction
   - Rate limiting and retry logic

3. **scrapers/tor_scraper.py** (Tor Integration)
   - TorScraper class
   - SOCKS5 proxy connection
   - Onion site fetching
   - Connection testing
   - Error handling for Tor failures

4. **scrapers/selenium_scraper.py** (Dynamic Content)
   - SeleniumScraper class
   - Chrome/Edge WebDriver support
   - Headless mode
   - Screenshot capability
   - JavaScript rendering

5. **config.py** (Configuration)
   - Environment variable loading
   - Target domain settings
   - Relevance score thresholds
   - Rate limiting configuration
   - Tor proxy settings
   - Leak keywords (English & Indonesian)

### Frontend Architecture

1. **api/client.ts** (API Client)
   - ApiClient class
   - REST API methods (startScan, getScanStatus, listScans, getResults)
   - WebSocket connection management
   - Auto-reconnect functionality
   - Heartbeat mechanism
   - Message handler subscription system

2. **components/Dashboard.tsx** (Main UI)
   - Real-time statistics display
   - Scan status monitoring
   - WebSocket message handling
   - Integration with ScanForm and ResultsList
   - Toast notifications

3. **components/ScanForm.tsx** (Scan Input)
   - URL input (multi-line textarea)
   - Scan options (clearnet, darknet, author crawling)
   - Form validation
   - Scan submission
   - Last scan ID display

4. **components/ResultsList.tsx** (Results Display)
   - Table-based result display
   - Relevance score color coding
   - Expandable row details
   - Email list display
   - Credential indicators
   - Sorting by relevance

5. **hooks/useScan.ts** (State Management)
   - Scan lifecycle management
   - WebSocket message handling
   - Result fetching
   - Error handling
   - Loading states

6. **types/index.ts** (Type Definitions)
   - ScanRequest, ScanResponse, ScanStatus
   - ScanResult, ScanResultsData
   - WebSocketMessage, ApiError

### Docker Configuration

1. **docker-compose.yml**
   - Three services: tor, backend, frontend
   - Network isolation
   - Volume mounting for scan results
   - Port mapping
   - Environment variable injection

2. **backend/Dockerfile**
   - Python 3.11-slim base image
   - Dependency installation
   - Health check
   - Uvicorn server

3. **frontend/Dockerfile**
   - Multi-stage build (Node + Nginx)
   - Production optimization
   - Nginx configuration
   - Static file serving

## Data Flow

1. **Scan Initiation**:
   - User submits URLs via ScanForm
   - Frontend calls `apiClient.startScan()`
   - Backend creates scan with unique ID
   - Background task starts discovery
   - WebSocket broadcasts "scan_started"

2. **Discovery Process**:
   - DiscoveryOrchestrator analyzes each URL
   - Fetches raw paste content
   - Extracts emails and credentials
   - Calculates relevance score
   - Optionally crawls author profiles
   - Updates progress via WebSocket

3. **Result Delivery**:
   - Completed results stored in memory
   - WebSocket broadcasts "scan_completed"
   - Frontend fetches results via `/api/results/{id}`
   - ResultsList displays with color coding
   - User can expand for details

## Security Features

- CORS restrictions on API
- Rate limiting on scrapers
- No credential storage (metadata only)
- Environment-based configuration
- Docker container isolation
- HTTPS support ready (via Nginx)

## Integration Points

**From project_discovery-main**:
- Discovery algorithm and relevance scoring
- Email extraction patterns
- Credential detection logic
- Author crawling functionality
- Configuration structure

**From PJNextScraper-master**:
- Tor SOCKS5 proxy integration
- Onion site fetching
- Connection error handling

**From NextFE-master**:
- UI component library (buttons, cards, forms)
- Styling system (Tailwind + shadcn/ui)
- Dark mode support
- Responsive layout patterns

## Development Notes

- Backend uses async/await for non-blocking scans
- Frontend uses React hooks for state management
- WebSocket provides real-time updates
- Docker Compose simplifies deployment
- Environment variables allow easy configuration
- Modular architecture enables easy extension
