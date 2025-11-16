# Deployment Notes

## System Status: ✅ OPERATIONAL

### Deployment Information
- **Deployment Date**: November 17, 2025
- **Docker Compose**: Successfully deployed
- **Frontend**: Running at http://localhost:3000
- **Backend**: Running at http://localhost:8000
- **API Documentation**: Available at http://localhost:8000/docs
- **Tor Service**: Running on ports 9050-9051

## Issue Resolution Log

### 1. PowerShell Script Syntax Error
**Issue**: Smart quotes in start.ps1 causing parsing errors
**Solution**: Recreated start.ps1 with proper straight quotes
**Status**: ✅ Fixed

### 2. Docker Desktop Not Running
**Issue**: Docker service not available
**Solution**: Started Docker Desktop manually
**Status**: ✅ Fixed

### 3. Missing package-lock.json
**Issue**: Frontend Dockerfile using `npm ci` which requires package-lock.json
**Solution**: Changed to `npm install` in Dockerfile
**Status**: ✅ Fixed

### 4. Versioned Imports in UI Components
**Issue**: UI components from NextFE-master had versioned imports (e.g., `from "next-themes@0.4.6"`)
**Root Cause**: Figma/v0 export format includes version numbers in imports
**Solution**: Batch PowerShell script to remove version numbers from all UI component imports
**Files Affected**: All files in `frontend/src/components/ui/`
**Status**: ✅ Fixed

## Running Services

```bash
# View all running containers
docker ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f tor

# Stop all services
docker-compose down

# Start services again
./start.ps1
```

## Container Health Status

All containers are running with health checks:
- **next-intelligence-frontend**: Port 3000 → nginx serving React app
- **next-intelligence-backend**: Port 8000 → FastAPI with uvicorn
- **next-intelligence-tor**: Ports 9050-9051 → Tor SOCKS5 proxy

## Testing the System

### 1. Backend API Test
```powershell
# Check scans endpoint
curl http://localhost:8000/api/scans

# Expected response: []
```

### 2. Frontend Access
Open browser to http://localhost:3000 to access the dashboard

### 3. WebSocket Connection
The frontend will automatically connect to `ws://localhost:8000/ws` for real-time updates

## Next Steps

1. **Submit First Scan**: Use the frontend form to submit a URL for scanning
2. **Monitor Results**: Watch real-time updates via WebSocket connection
3. **Review API Documentation**: Visit http://localhost:8000/docs for Swagger UI
4. **Check Tor Connectivity**: Verify Tor proxy is working for darknet searches

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Docker Network                       │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   Frontend   │─────▶│   Backend    │───▶│     Tor     │ │
│  │  (React/TS)  │◀─────│  (FastAPI)   │    │   Proxy     │ │
│  │  Port: 3000  │  WS  │  Port: 8000  │    │ Port: 9050  │ │
│  └──────────────┘      └──────────────┘    └─────────────┘ │
│                              │                               │
│                              ▼                               │
│                     ┌──────────────────┐                     │
│                     │  Discovery Engine │                    │
│                     │  - Paste Sites    │                    │
│                     │  - Tor Scraper    │                    │
│                     │  - Selenium       │                    │
│                     └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## System Features

### Backend Capabilities
- ✅ REST API with POST /api/scan, GET /api/scans, GET /api/results
- ✅ WebSocket support for real-time updates
- ✅ Discovery engine with relevance scoring (40% domain, 30% emails, 30% keywords)
- ✅ Tor integration for darknet access
- ✅ Selenium for dynamic content scraping
- ✅ Background task processing
- ✅ CORS enabled for frontend communication

### Frontend Features
- ✅ React 18 with TypeScript
- ✅ Dashboard with real-time statistics
- ✅ Scan submission form
- ✅ Results list with expandable details
- ✅ WebSocket client with auto-reconnect
- ✅ TailwindCSS + shadcn/ui components
- ✅ Responsive design

### Infrastructure
- ✅ Docker Compose orchestration
- ✅ Health checks for all services
- ✅ Volume persistence for scan results
- ✅ Nginx for production frontend serving
- ✅ Environment variable configuration

## Troubleshooting

### Frontend Not Loading
1. Check if container is running: `docker ps`
2. View logs: `docker-compose logs -f frontend`
3. Verify port 3000 is not in use: `netstat -an | findstr :3000`

### Backend API Not Responding
1. Check container health: `docker ps`
2. View logs: `docker-compose logs -f backend`
3. Test connectivity: `curl http://localhost:8000/api/scans`

### Tor Connection Issues
1. Check Tor container: `docker ps | findstr tor`
2. View logs: `docker-compose logs -f tor`
3. Verify ports: `netstat -an | findstr :9050`

### WebSocket Connection Failing
1. Check browser console for connection errors
2. Verify backend is running: `curl http://localhost:8000/api/scans`
3. Check CORS configuration in backend/api/main.py

## Configuration Files

- **docker-compose.yml**: Service orchestration
- **backend/Dockerfile**: Python backend build
- **frontend/Dockerfile**: Node.js frontend build with nginx
- **.env**: Environment variables (API URL, search depth, etc.)
- **nginx.conf**: Frontend serving configuration
- **start.ps1**: Windows startup script
- **stop.ps1**: Windows shutdown script

## Dependencies

### Backend (Python 3.11)
- FastAPI: Web framework
- BeautifulSoup4: HTML parsing
- Selenium: Dynamic content scraping
- PySocks: Tor SOCKS5 support
- Uvicorn: ASGI server
- Requests: HTTP client

### Frontend (Node 20)
- React 18: UI framework
- TypeScript: Type safety
- Vite: Build tool
- TailwindCSS: Styling
- shadcn/ui: Component library
- Lucide React: Icons

### Infrastructure
- Docker & Docker Compose
- Nginx (Alpine)
- dperson/torproxy: Tor service

## Performance Considerations

- **Build Time**: ~30-60 seconds on first run
- **Startup Time**: ~5-10 seconds
- **Memory Usage**: ~500MB total (all containers)
- **Storage**: Scan results stored in Docker volume

## Security Notes

- Tor proxy isolated in Docker network
- CORS configured for localhost only (update for production)
- Environment variables for sensitive configuration
- Health checks prevent unhealthy containers from serving traffic

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement scan history persistence (database)
- [ ] Add rate limiting for API endpoints
- [ ] Implement scan result export (JSON/CSV)
- [ ] Add more paste site sources
- [ ] Implement darknet search integration
- [ ] Add email notification for completed scans
- [ ] Create admin dashboard for system monitoring
