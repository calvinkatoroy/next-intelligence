/**
 * Dashboard Component
 * Main dashboard with ScanForm, ResultsList, and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { ScanForm } from './ScanForm';
import { ResultsList } from './ResultsList';
import { apiClient } from '../api/client';
import type { ScanStatus, WebSocketMessage } from '../types';
import { useScan } from '../hooks/useScan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [allScans, setAllScans] = useState<ScanStatus[]>([]);
  const { currentScan, results, isLoading } = useScan(activeScanId || undefined);

  // Load all scans on mount
  useEffect(() => {
    loadScans();
    
    // Set up WebSocket for real-time updates
    apiClient.connectWebSocket();
    const unsubscribe = apiClient.onMessage(handleWebSocketMessage);
    
    return () => {
      unsubscribe();
      apiClient.disconnectWebSocket();
    };
  }, []);

  const loadScans = async () => {
    try {
      const scans = await apiClient.listScans();
      setAllScans(scans);
    } catch (error) {
      console.error('Failed to load scans:', error);
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    // Reload scans list on any update
    loadScans();
    
    // Show toast notifications
    switch (message.type) {
      case 'scan_started':
        toast.info('Scan started', {
          description: `Scan ID: ${message.scan_id.substring(0, 8)}...`
        });
        break;
        
      case 'scan_completed':
        toast.success('Scan completed!', {
          description: `Found ${message.total_results} results`
        });
        break;
        
      case 'scan_failed':
        toast.error('Scan failed', {
          description: message.error
        });
        break;
    }
  };

  const handleScanStarted = (scanId: string) => {
    setActiveScanId(scanId);
    loadScans();
  };

  // Calculate statistics
  const runningScans = allScans.filter(s => s.status === 'running' || s.status === 'queued');
  const completedScans = allScans.filter(s => s.status === 'completed');
  const totalResults = completedScans.reduce((sum, scan) => sum + scan.total_results, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Project NEXT Intelligence</h1>
                <p className="text-sm text-muted-foreground">
                  OSINT Platform for UI Credential Monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningScans.length}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allScans.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedScans.length}</div>
              <p className="text-xs text-muted-foreground">Successfully finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Results</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResults}</div>
              <p className="text-xs text-muted-foreground">Items discovered</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Scan Status */}
        {currentScan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Scan Status</CardTitle>
              <CardDescription>
                Scan ID: {currentScan.scan_id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    variant={
                      currentScan.status === 'completed' ? 'default' :
                      currentScan.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {currentScan.status.toUpperCase()}
                  </Badge>
                </div>
                
                {currentScan.status === 'running' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress:</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(currentScan.progress * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentScan.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Results Found:</span>
                  <span className="text-sm">{currentScan.total_results}</span>
                </div>
                
                {currentScan.error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                    <p className="text-sm font-medium">Error:</p>
                    <p className="text-sm">{currentScan.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scan Form */}
          <div className="lg:col-span-1">
            <ScanForm onScanStarted={handleScanStarted} />
          </div>

          {/* Results List */}
          <div className="lg:col-span-2">
            <ResultsList
              results={results?.results || []}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
