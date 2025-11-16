/**
 * useScan Hook
 * Custom React hook for scan management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { ScanStatus, ScanResultsData, WebSocketMessage } from '../types';
import { toast } from 'sonner';

export const useScan = (scanId?: string) => {
  const [currentScan, setCurrentScan] = useState<ScanStatus | null>(null);
  const [results, setResults] = useState<ScanResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start a new scan
  const startScan = useCallback(async (urls: string[], options = {
    enable_clearnet: true,
    enable_darknet: false,
    crawl_authors: true
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.startScan({
        urls,
        ...options
      });
      
      // Fetch initial status
      const status = await apiClient.getScanStatus(response.scan_id);
      setCurrentScan(status);
      
      return response.scan_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start scan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh scan status
  const refreshStatus = useCallback(async (id: string) => {
    try {
      const status = await apiClient.getScanStatus(id);
      setCurrentScan(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refresh results
  const refreshResults = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const data = await apiClient.getResults(id);
      setResults(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch results';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    // Only process messages for current scan
    if (scanId && message.scan_id !== scanId) {
      return;
    }

    switch (message.type) {
      case 'scan_started':
        toast.info('Scan started');
        if (scanId) {
          refreshStatus(scanId);
        }
        break;
        
      case 'scan_progress':
        if (currentScan) {
          setCurrentScan({
            ...currentScan,
            progress: message.progress || 0
          });
        }
        break;
        
      case 'scan_completed':
        toast.success(`Scan completed! Found ${message.total_results} results`);
        if (scanId) {
          refreshStatus(scanId);
          refreshResults(scanId);
        }
        break;
        
      case 'scan_failed':
        toast.error(`Scan failed: ${message.error}`);
        if (currentScan) {
          setCurrentScan({
            ...currentScan,
            status: 'failed',
            error: message.error
          });
        }
        break;
    }
  }, [scanId, currentScan, refreshStatus, refreshResults]);

  // Set up WebSocket connection
  useEffect(() => {
    apiClient.connectWebSocket();
    const unsubscribe = apiClient.onMessage(handleWebSocketMessage);
    
    return () => {
      unsubscribe();
    };
  }, [handleWebSocketMessage]);

  // Load scan data if scanId is provided
  useEffect(() => {
    if (!scanId) return;

    const loadScan = async () => {
      try {
        setIsLoading(true);
        
        // Load status
        const status = await apiClient.getScanStatus(scanId);
        setCurrentScan(status);
        
        // Load results if completed
        if (status.status === 'completed') {
          const data = await apiClient.getResults(scanId);
          setResults(data);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load scan';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadScan();
  }, [scanId]);

  return {
    currentScan,
    results,
    isLoading,
    error,
    startScan,
    refreshStatus,
    refreshResults
  };
};
