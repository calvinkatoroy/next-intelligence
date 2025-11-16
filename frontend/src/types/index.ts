/**
 * TypeScript type definitions for Project NEXT Intelligence
 */

export interface ScanRequest {
  urls: string[];
  enable_clearnet: boolean;
  enable_darknet: boolean;
  crawl_authors: boolean;
}

export interface ScanResponse {
  scan_id: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface ScanStatus {
  scan_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  total_results: number;
  timestamp: string;
  error?: string;
}

export interface ScanResult {
  url: string;
  source: string;
  title: string;
  author: string;
  relevance_score: number;
  emails: string[];
  target_emails: string[];
  has_credentials: boolean;
  timestamp: string;
  content_preview?: string;
}

export interface ScanResultsData {
  metadata: {
    target_domain: string;
    timestamp: string;
    total_results: number;
    clearnet_results: number;
    darknet_results: number;
  };
  summary: {
    total_results: number;
    high_priority_count: number;
    total_target_emails: number;
    credentials_found: number;
  };
  results: ScanResult[];
}

export interface WebSocketMessage {
  type: 'scan_started' | 'scan_progress' | 'scan_completed' | 'scan_failed';
  scan_id: string;
  progress?: number;
  total_results?: number;
  error?: string;
  timestamp: string;
}

export interface ApiError {
  detail: string;
}
