"""
FastAPI Main Application for Project NEXT Intelligence
REST API endpoints and background task management
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime
import asyncio
import json

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import API_HOST, API_PORT, CORS_ORIGINS, LOG_FILE, TARGET_DOMAIN
from scrapers.discovery_engine import DiscoveryOrchestrator

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

# Create FastAPI app
app = FastAPI(
    title="Project NEXT Intelligence API",
    description="OSINT platform for detecting leaked Universitas Indonesia credentials",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
active_scans: Dict[str, Dict] = {}
scan_results: Dict[str, Dict] = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to WebSocket client: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

manager = ConnectionManager()


# Pydantic models
class ScanRequest(BaseModel):
    """Request model for starting a new scan"""
    urls: List[str] = Field(..., description="List of paste URLs to scan")
    enable_clearnet: bool = Field(default=True, description="Enable clearnet discovery")
    enable_darknet: bool = Field(default=False, description="Enable darknet discovery")
    crawl_authors: bool = Field(default=True, description="Crawl identified authors' profiles")


class ScanResponse(BaseModel):
    """Response model for scan submission"""
    scan_id: str
    status: str
    message: str
    timestamp: str


class ScanStatus(BaseModel):
    """Model for scan status"""
    scan_id: str
    status: str
    progress: float
    total_results: int
    timestamp: str
    error: Optional[str] = None


class ScanResult(BaseModel):
    """Model for individual scan result"""
    url: str
    source: str
    author: str
    relevance_score: float
    emails: List[str]
    target_emails: List[str]
    has_credentials: bool
    timestamp: str


# Background task function
async def run_scan_task(scan_id: str, scan_request: ScanRequest):
    """
    Background task to run the discovery scan
    
    Args:
        scan_id: Unique identifier for this scan
        scan_request: Scan configuration
    """
    try:
        logger.info(f"Starting scan {scan_id}")
        
        # Update status
        active_scans[scan_id]['status'] = 'running'
        active_scans[scan_id]['progress'] = 0.1
        
        # Broadcast status update
        await manager.broadcast({
            'type': 'scan_started',
            'scan_id': scan_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # Initialize discovery orchestrator
        orchestrator = DiscoveryOrchestrator()
        
        # Update progress
        active_scans[scan_id]['progress'] = 0.3
        await manager.broadcast({
            'type': 'scan_progress',
            'scan_id': scan_id,
            'progress': 0.3
        })
        
        # Run discovery
        results = orchestrator.run_full_discovery(
            clearnet_urls=scan_request.urls,
            enable_clearnet=scan_request.enable_clearnet,
            enable_darknet=scan_request.enable_darknet,
            crawl_authors=scan_request.crawl_authors
        )
        
        # Update progress
        active_scans[scan_id]['progress'] = 0.9
        
        # Store results
        scan_results[scan_id] = results
        
        # Update final status
        active_scans[scan_id]['status'] = 'completed'
        active_scans[scan_id]['progress'] = 1.0
        active_scans[scan_id]['total_results'] = len(results['results'])
        active_scans[scan_id]['completed_at'] = datetime.now().isoformat()
        
        logger.info(f"Scan {scan_id} completed with {len(results['results'])} results")
        
        # Broadcast completion
        await manager.broadcast({
            'type': 'scan_completed',
            'scan_id': scan_id,
            'total_results': len(results['results']),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in scan {scan_id}: {str(e)}")
        active_scans[scan_id]['status'] = 'failed'
        active_scans[scan_id]['error'] = str(e)
        active_scans[scan_id]['completed_at'] = datetime.now().isoformat()
        
        # Broadcast error
        await manager.broadcast({
            'type': 'scan_failed',
            'scan_id': scan_id,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Project NEXT Intelligence API",
        "version": "1.0.0",
        "status": "operational",
        "target_domain": TARGET_DOMAIN
    }


@app.post("/api/scan", response_model=ScanResponse)
async def start_scan(scan_request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Start a new discovery scan
    
    Args:
        scan_request: Scan configuration with URLs and options
        background_tasks: FastAPI background tasks
        
    Returns:
        ScanResponse with scan_id and status
    """
    # Validate URLs
    if not scan_request.urls or len(scan_request.urls) == 0:
        raise HTTPException(status_code=400, detail="At least one URL is required")
    
    # Generate scan ID
    scan_id = str(uuid.uuid4())
    
    # Initialize scan metadata
    active_scans[scan_id] = {
        'scan_id': scan_id,
        'status': 'queued',
        'progress': 0.0,
        'total_results': 0,
        'created_at': datetime.now().isoformat(),
        'urls': scan_request.urls,
        'options': {
            'enable_clearnet': scan_request.enable_clearnet,
            'enable_darknet': scan_request.enable_darknet,
            'crawl_authors': scan_request.crawl_authors
        }
    }
    
    # Add to background tasks
    background_tasks.add_task(run_scan_task, scan_id, scan_request)
    
    logger.info(f"Created new scan: {scan_id}")
    
    return ScanResponse(
        scan_id=scan_id,
        status="queued",
        message="Scan started successfully",
        timestamp=datetime.now().isoformat()
    )


@app.get("/api/scans", response_model=List[ScanStatus])
async def list_scans():
    """
    List all scans with their current status
    
    Returns:
        List of ScanStatus objects
    """
    scans = []
    for scan_id, scan_data in active_scans.items():
        scans.append(ScanStatus(
            scan_id=scan_id,
            status=scan_data['status'],
            progress=scan_data['progress'],
            total_results=scan_data['total_results'],
            timestamp=scan_data['created_at'],
            error=scan_data.get('error')
        ))
    
    return sorted(scans, key=lambda x: x.timestamp, reverse=True)


@app.get("/api/scans/{scan_id}", response_model=ScanStatus)
async def get_scan_status(scan_id: str):
    """
    Get status of a specific scan
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        ScanStatus object
    """
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan_data = active_scans[scan_id]
    
    return ScanStatus(
        scan_id=scan_id,
        status=scan_data['status'],
        progress=scan_data['progress'],
        total_results=scan_data['total_results'],
        timestamp=scan_data['created_at'],
        error=scan_data.get('error')
    )


@app.get("/api/results/{scan_id}")
async def get_scan_results(scan_id: str):
    """
    Get results of a completed scan
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        Scan results with metadata and discovered items
    """
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if active_scans[scan_id]['status'] != 'completed':
        raise HTTPException(
            status_code=400, 
            detail=f"Scan is not completed yet. Current status: {active_scans[scan_id]['status']}"
        )
    
    if scan_id not in scan_results:
        raise HTTPException(status_code=404, detail="Results not found")
    
    return scan_results[scan_id]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates
    
    Clients can connect here to receive real-time scan updates
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and receive any client messages
            data = await websocket.receive_text()
            
            # Echo back for heartbeat
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_scans": len([s for s in active_scans.values() if s['status'] == 'running']),
        "total_scans": len(active_scans)
    }


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
