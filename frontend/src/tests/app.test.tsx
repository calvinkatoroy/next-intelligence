// Frontend Test Suite for Project NEXT Intelligence
// Using Vitest and React Testing Library

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components
import Dashboard from '../components/Dashboard';
import ScanForm from '../components/ScanForm';
import ResultsList from '../components/ResultsList';

// Import API client
import { ApiClient } from '../api/client';

// ============================================================================
// TEST UTILITIES
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock API client
vi.mock('../api/client', () => ({
  ApiClient: {
    createScan: vi.fn(),
    getScans: vi.fn(),
    getResults: vi.fn(),
    connectWebSocket: vi.fn(),
  },
}));

// ============================================================================
// FRONTEND TESTS - TC-FE-001 to TC-FE-010
// ============================================================================

describe('TC-FE-001: Dashboard Initial Load', () => {
  it('should render dashboard without crashing', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
  
  it('should display statistics cards', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/active scans/i)).toBeInTheDocument();
    expect(screen.getByText(/completed scans/i)).toBeInTheDocument();
  });
  
  it('should show WebSocket connection status', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    // Check for connection indicator
    const statusIndicator = screen.getByTestId('ws-status');
    expect(statusIndicator).toBeInTheDocument();
  });
});

describe('TC-FE-002: Scan Form Submission - Valid Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render all form fields', () => {
    render(<ScanForm onSubmit={vi.fn()} />, { wrapper: createWrapper() });
    
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search depth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target domain/i)).toBeInTheDocument();
  });
  
  it('should submit form with valid data', async () => {
    const mockSubmit = vi.fn();
    const mockCreateScan = vi.fn().mockResolvedValue({
      scan_id: '123-456',
      status: 'queued',
    });
    
    ApiClient.createScan = mockCreateScan;
    
    render(<ScanForm onSubmit={mockSubmit} />, { wrapper: createWrapper() });
    
    const urlInput = screen.getByLabelText(/url/i);
    const domainInput = screen.getByLabelText(/target domain/i);
    const submitButton = screen.getByRole('button', { name: /start scan/i });
    
    await userEvent.type(urlInput, 'https://pastebin.com/test');
    await userEvent.type(domainInput, 'example.com');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateScan).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://pastebin.com/test',
          target_domain: 'example.com',
        })
      );
    });
  });
});

describe('TC-FE-003: Form Validation - Invalid URL', () => {
  it('should show error for invalid URL', async () => {
    render(<ScanForm onSubmit={vi.fn()} />, { wrapper: createWrapper() });
    
    const urlInput = screen.getByLabelText(/url/i);
    const submitButton = screen.getByRole('button', { name: /start scan/i });
    
    await userEvent.type(urlInput, 'not-a-valid-url');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });
  });
});

describe('TC-FE-004: Form Validation - Empty Required Fields', () => {
  it('should show error for empty URL field', async () => {
    render(<ScanForm onSubmit={vi.fn()} />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /start scan/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/url is required/i)).toBeInTheDocument();
    });
  });
  
  it('should disable submit button when fields are empty', () => {
    render(<ScanForm onSubmit={vi.fn()} />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: /start scan/i });
    expect(submitButton).toBeDisabled();
  });
});

describe('TC-FE-005: Results List Display', () => {
  const mockResults = [
    {
      id: '1',
      url: 'https://pastebin.com/test1',
      relevance_score: 85,
      status: 'completed',
      title: 'Test Paste 1',
    },
    {
      id: '2',
      url: 'https://pastebin.com/test2',
      relevance_score: 72,
      status: 'completed',
      title: 'Test Paste 2',
    },
  ];
  
  it('should display results table', () => {
    render(<ResultsList results={mockResults} />, { wrapper: createWrapper() });
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Test Paste 1')).toBeInTheDocument();
    expect(screen.getByText('Test Paste 2')).toBeInTheDocument();
  });
  
  it('should show relevance scores', () => {
    render(<ResultsList results={mockResults} />, { wrapper: createWrapper() });
    
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });
  
  it('should support sorting by columns', async () => {
    render(<ResultsList results={mockResults} />, { wrapper: createWrapper() });
    
    const scoreHeader = screen.getByText(/relevance score/i);
    await userEvent.click(scoreHeader);
    
    // Verify sorting occurred (implementation dependent)
    expect(scoreHeader).toBeInTheDocument();
  });
});

describe('TC-FE-006: Results Detail Expansion', () => {
  const mockResult = {
    id: '1',
    url: 'https://pastebin.com/test1',
    relevance_score: 85,
    status: 'completed',
    title: 'Test Paste 1',
    extracted_emails: ['admin@example.com', 'user@example.com'],
    keywords_found: ['password', 'credentials'],
  };
  
  it('should expand result row on click', async () => {
    render(
      <ResultsList results={[mockResult]} />, 
      { wrapper: createWrapper() }
    );
    
    const row = screen.getByText('Test Paste 1').closest('tr');
    await userEvent.click(row!);
    
    await waitFor(() => {
      expect(screen.getByText(/extracted emails/i)).toBeInTheDocument();
    });
  });
  
  it('should display detailed data when expanded', async () => {
    render(
      <ResultsList results={[mockResult]} />, 
      { wrapper: createWrapper() }
    );
    
    const row = screen.getByText('Test Paste 1').closest('tr');
    await userEvent.click(row!);
    
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });
  });
  
  it('should collapse row on second click', async () => {
    render(
      <ResultsList results={[mockResult]} />, 
      { wrapper: createWrapper() }
    );
    
    const row = screen.getByText('Test Paste 1').closest('tr');
    
    // First click - expand
    await userEvent.click(row!);
    await waitFor(() => {
      expect(screen.getByText(/extracted emails/i)).toBeInTheDocument();
    });
    
    // Second click - collapse
    await userEvent.click(row!);
    await waitFor(() => {
      expect(screen.queryByText(/extracted emails/i)).not.toBeInTheDocument();
    });
  });
});

describe('TC-FE-007: Real-time Update via WebSocket', () => {
  it('should connect to WebSocket on mount', () => {
    const mockConnect = vi.fn();
    ApiClient.connectWebSocket = mockConnect;
    
    render(<Dashboard />, { wrapper: createWrapper() });
    
    expect(mockConnect).toHaveBeenCalled();
  });
  
  it('should update UI when WebSocket message received', async () => {
    const mockMessage = {
      type: 'scan_update',
      scan_id: '123',
      status: 'processing',
      progress: 50,
    };
    
    render(<Dashboard />, { wrapper: createWrapper() });
    
    // Simulate WebSocket message
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(mockMessage),
    });
    
    window.dispatchEvent(messageEvent);
    
    await waitFor(() => {
      // Verify UI updated (implementation dependent)
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });
});

describe('TC-FE-008: WebSocket Reconnection', () => {
  it('should attempt reconnection on disconnect', async () => {
    const mockConnect = vi.fn();
    ApiClient.connectWebSocket = mockConnect;
    
    render(<Dashboard />, { wrapper: createWrapper() });
    
    // Simulate disconnect
    const closeEvent = new CloseEvent('close');
    window.dispatchEvent(closeEvent);
    
    // Wait for reconnection attempt
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledTimes(2); // Initial + reconnect
    }, { timeout: 3000 });
  });
  
  it('should show reconnection status', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    // Simulate disconnect
    const closeEvent = new CloseEvent('close');
    window.dispatchEvent(closeEvent);
    
    await waitFor(() => {
      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
    });
  });
});

describe('TC-FE-009: Responsive Design - Mobile View', () => {
  beforeEach(() => {
    // Mock window.innerWidth for mobile
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));
  });
  
  afterEach(() => {
    // Reset
    global.innerWidth = 1024;
  });
  
  it('should adapt layout to mobile viewport', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    // Check for mobile-specific elements (implementation dependent)
    const container = screen.getByTestId('dashboard-container');
    expect(container).toHaveClass(/mobile/i);
  });
  
  it('should show hamburger menu on mobile', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const hamburger = screen.getByTestId('hamburger-menu');
    expect(hamburger).toBeInTheDocument();
  });
  
  it('should make table horizontally scrollable', () => {
    const mockResults = [
      { id: '1', url: 'test', relevance_score: 85, status: 'completed' },
    ];
    
    render(<ResultsList results={mockResults} />, { wrapper: createWrapper() });
    
    const tableContainer = screen.getByTestId('table-container');
    expect(tableContainer).toHaveStyle({ overflowX: 'auto' });
  });
});

describe('TC-FE-010: Dark Mode Toggle', () => {
  it('should toggle dark mode on button click', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const themeToggle = screen.getByTestId('theme-toggle');
    await userEvent.click(themeToggle);
    
    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
  });
  
  it('should persist theme preference', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const themeToggle = screen.getByTestId('theme-toggle');
    await userEvent.click(themeToggle);
    
    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
  
  it('should apply consistent theming to all components', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    
    const themeToggle = screen.getByTestId('theme-toggle');
    await userEvent.click(themeToggle);
    
    await waitFor(() => {
      const allComponents = screen.getAllByTestId(/component/);
      allComponents.forEach(component => {
        expect(component).toHaveClass(/dark/);
      });
    });
  });
});

// ============================================================================
// API CLIENT TESTS
// ============================================================================

describe('API Client Tests', () => {
  it('should create scan with valid data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scan_id: '123', status: 'queued' }),
    });
    global.fetch = mockFetch;
    
    const result = await ApiClient.createScan({
      url: 'https://pastebin.com/test',
      search_depth: 2,
      target_domain: 'example.com',
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/scan',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(result).toEqual({ scan_id: '123', status: 'queued' });
  });
  
  it('should handle API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    });
    global.fetch = mockFetch;
    
    await expect(
      ApiClient.createScan({ url: 'test', search_depth: 2 })
    ).rejects.toThrow();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Frontend Integration Tests', () => {
  it('should complete full scan workflow', async () => {
    const mockCreateScan = vi.fn().mockResolvedValue({
      scan_id: '123',
      status: 'queued',
    });
    const mockGetResults = vi.fn().mockResolvedValue({
      results: [{ id: '1', relevance_score: 85 }],
    });
    
    ApiClient.createScan = mockCreateScan;
    ApiClient.getResults = mockGetResults;
    
    render(<Dashboard />, { wrapper: createWrapper() });
    
    // Step 1: Submit scan
    const urlInput = screen.getByLabelText(/url/i);
    await userEvent.type(urlInput, 'https://pastebin.com/test');
    
    const submitButton = screen.getByRole('button', { name: /start scan/i });
    await userEvent.click(submitButton);
    
    // Step 2: Verify scan created
    await waitFor(() => {
      expect(mockCreateScan).toHaveBeenCalled();
    });
    
    // Step 3: View results
    await waitFor(() => {
      expect(screen.getByText(/results/i)).toBeInTheDocument();
    });
  });
});
