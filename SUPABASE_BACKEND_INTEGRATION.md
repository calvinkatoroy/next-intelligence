# 📚 Supabase Backend Integration Guide

This guide explains how to integrate your FastAPI backend with Supabase.

## Why Integrate Backend with Supabase?

Currently, your frontend connects directly to Supabase (great for auth and simple queries), but your backend can handle:
- Complex scan operations
- Background processing
- Advanced queries with business logic
- File uploads and processing
- Rate limiting and security

---

## Installation

```powershell
cd backend
pip install supabase python-dotenv
```

---

## Step 1: Create Supabase Client

Create `backend/lib/supabase_client.py`:

```python
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Use service_role key for backend

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase() -> Client:
    """Get Supabase client instance"""
    return supabase
```

---

## Step 2: Update Scan Endpoints

Update `backend/api/main.py`:

```python
from fastapi import FastAPI, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from lib.supabase_client import get_supabase
from supabase import Client
import uuid

app = FastAPI()

# Update CORS with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/scans")
async def create_scan(
    scan_request: dict,
    background_tasks: BackgroundTasks,
    supabase: Client = Depends(get_supabase)
):
    """Create a new scan and save to Supabase"""
    scan_id = str(uuid.uuid4())
    
    # Save scan to Supabase
    scan_data = {
        "id": scan_id,
        "user_id": scan_request["user_id"],
        "urls": scan_request["urls"],
        "enable_clearnet": scan_request.get("enable_clearnet", True),
        "enable_darknet": scan_request.get("enable_darknet", False),
        "status": "queued",
        "progress": 0.0
    }
    
    supabase.table("scans").insert(scan_data).execute()
    
    # Run scan in background
    background_tasks.add_task(process_scan, scan_id, scan_request)
    
    return {"scan_id": scan_id, "status": "queued"}

async def process_scan(scan_id: str, scan_request: dict):
    """Background task to process scan"""
    supabase = get_supabase()
    
    try:
        # Update status to running
        supabase.table("scans").update({
            "status": "running",
            "progress": 0.0
        }).eq("id", scan_id).execute()
        
        # Your existing scan logic here
        from scrapers.discovery_engine import DiscoveryEngine
        
        engine = DiscoveryEngine(
            enable_clearnet=scan_request["enable_clearnet"],
            enable_darknet=scan_request["enable_darknet"]
        )
        
        results = []
        for url in scan_request["urls"]:
            url_results = engine.discover_from_url(url)
            
            # Save each result to Supabase
            for result in url_results:
                result_data = {
                    "scan_id": scan_id,
                    "user_id": scan_request["user_id"],
                    "url": result["url"],
                    "source": result["source"],
                    "title": result["title"],
                    "author": result.get("author", "Unknown"),
                    "content_preview": result.get("content_preview"),
                    "relevance_score": result.get("relevance_score", 0.5),
                    "has_credentials": result.get("has_credentials", False),
                    "emails": result.get("emails", [])
                }
                
                supabase.table("scan_results").insert(result_data).execute()
            
            results.extend(url_results)
            
            # Update progress
            progress = len(results) / (len(scan_request["urls"]) * 10)
            supabase.table("scans").update({
                "progress": min(progress, 1.0)
            }).eq("id", scan_id).execute()
        
        # Mark as completed
        supabase.table("scans").update({
            "status": "completed",
            "progress": 1.0,
            "total_results": len(results)
        }).eq("id", scan_id).execute()
        
        # Create alert if high-value results found
        high_value = [r for r in results if r.get("relevance_score", 0) > 0.7]
        if high_value:
            supabase.table("alerts").insert({
                "user_id": scan_request["user_id"],
                "scan_id": scan_id,
                "title": f"High-value results found ({len(high_value)})",
                "severity": "high",
                "message": f"Found {len(high_value)} high-relevance results in scan"
            }).execute()
    
    except Exception as e:
        # Mark as failed
        supabase.table("scans").update({
            "status": "failed",
            "error": str(e)
        }).eq("id", scan_id).execute()

@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: str, supabase: Client = Depends(get_supabase)):
    """Get scan status"""
    response = supabase.table("scans").select("*").eq("id", scan_id).execute()
    return response.data[0] if response.data else {"error": "Scan not found"}

@app.get("/api/scans/{scan_id}/results")
async def get_scan_results(
    scan_id: str,
    limit: int = 50,
    supabase: Client = Depends(get_supabase)
):
    """Get scan results"""
    response = supabase.table("scan_results") \
        .select("*") \
        .eq("scan_id", scan_id) \
        .order("relevance_score", desc=True) \
        .limit(limit) \
        .execute()
    
    return response.data
```

---

## Step 3: Update Frontend API Client

Update `frontend/src/api/client.ts`:

```typescript
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = {
  async startScan(urls: string[], options: {
    enableClearnet?: boolean;
    enableDarknet?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const response = await fetch(`${API_URL}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id,
        urls,
        ...options
      })
    });
    
    return response.json();
  },
  
  async getScan(scanId: string) {
    const response = await fetch(`${API_URL}/api/scans/${scanId}`);
    return response.json();
  },
  
  async getScanResults(scanId: string) {
    const response = await fetch(`${API_URL}/api/scans/${scanId}/results`);
    return response.json();
  }
};
```

---

## Step 4: Real-time Updates with Supabase

Update `frontend/src/hooks/useScan.ts`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiClient } from '../api/client';

export function useScan(scanId?: string) {
  const [scan, setScan] = useState(null);
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (!scanId) return;
    
    // Initial fetch
    apiClient.getScan(scanId).then(setScan);
    apiClient.getScanResults(scanId).then(setResults);
    
    // Subscribe to real-time updates
    const scanSubscription = supabase
      .channel(`scan:${scanId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scans',
        filter: `id=eq.${scanId}`
      }, (payload) => {
        setScan(payload.new);
      })
      .subscribe();
    
    const resultsSubscription = supabase
      .channel(`results:${scanId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_results',
        filter: `scan_id=eq.${scanId}`
      }, (payload) => {
        setResults(prev => [...prev, payload.new]);
      })
      .subscribe();
    
    return () => {
      scanSubscription.unsubscribe();
      resultsSubscription.unsubscribe();
    };
  }, [scanId]);
  
  return { scan, results };
}
```

---

## Architecture Overview

```
Frontend (React)
    ↓
    ├─→ Supabase Client (Auth, Simple Queries)
    │
    └─→ FastAPI Backend (/api/scans)
            ↓
            ├─→ Supabase (Save Results)
            ├─→ Background Tasks (Scraping)
            └─→ Discovery Engine
```

---

## Benefits

✅ **Frontend**: Direct Supabase for auth + fast reads
✅ **Backend**: Complex operations + background processing
✅ **Real-time**: Supabase subscriptions for live updates
✅ **Security**: RLS policies + backend validation
✅ **Scalability**: Background tasks don't block requests

---

## Testing

1. Start backend: `uvicorn api.main:app --reload`
2. Start frontend: `npm run dev`
3. Create a scan from dashboard
4. Watch real-time updates as results populate!

---

## Deployment Notes

- Backend needs **service_role** key (not anon key)
- Frontend needs **anon** key
- Set CORS origins to your production frontend URL
- Use environment variables for all secrets

Done! Your backend is now fully integrated with Supabase. 🎉
