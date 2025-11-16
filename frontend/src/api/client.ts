/**
 * API Client for Project NEXT Intelligence
 * Handles REST API calls and WebSocket connections
 */

import type {
  ScanRequest,
  ScanResponse,
  ScanStatus,
  ScanResultsData,
  WebSocketMessage,
  ApiError
} from '../types';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Start a new scan
   */
  async startScan(request: ScanRequest): Promise<ScanResponse> {
    const response = await fetch(`${this.baseUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to start scan');
    }

    return response.json();
  }

  /**
   * Get status of a specific scan
   */
  async getScanStatus(scanId: string): Promise<ScanStatus> {
    const response = await fetch(`${this.baseUrl}/api/scans/${scanId}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get scan status');
    }

    return response.json();
  }

  /**
   * List all scans
   */
  async listScans(): Promise<ScanStatus[]> {
    const response = await fetch(`${this.baseUrl}/api/scans`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to list scans');
    }

    return response.json();
  }

  /**
   * Get results of a completed scan
   */
  async getResults(scanId: string): Promise<ScanResultsData> {
    const response = await fetch(`${this.baseUrl}/api/results/${scanId}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to get scan results');
    }

    return response.json();
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    
    try {
      this.ws = new WebSocket(`${wsUrl}/ws`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.wsReconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.notifyMessageHandlers(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.stopHeartbeat();
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to WebSocket messages
   */
  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Notify all message handlers
   */
  private notifyMessageHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached');
      return;
    }

    this.wsReconnectAttempts++;
    console.log(`Attempting to reconnect WebSocket (${this.wsReconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay * this.wsReconnectAttempts);
  }

  /**
   * Heartbeat to keep connection alive
   */
  private heartbeatInterval: number | null = null;

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export default ApiClient;
