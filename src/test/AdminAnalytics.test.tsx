import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminAnalytics from '@/components/AdminAnalytics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client');

const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

const mockAnalyticsData = {
  profiles: [
    { role: 'customer', city: 'Mumbai', created_at: '2024-01-01' },
    { role: 'provider', city: 'Delhi', created_at: '2024-01-15' },
    { role: 'customer', city: 'Mumbai', created_at: '2024-02-01' }
  ],
  bookings: [
    {
      id: '1',
      total_amount: 1000,
      status: 'completed',
      created_at: '2024-01-10',
      service: { name: 'Cleaning', category_id: 'cat1' },
      provider: { full_name: 'John Doe', business_name: 'Clean Co' },
      customer_address: 'Mumbai, Maharashtra'
    },
    {
      id: '2',
      total_amount: 2000,
      status: 'completed',
      created_at: '2024-02-10',
      service: { name: 'Plumbing', category_id: 'cat2' },
      provider: { full_name: 'Jane Smith', business_name: 'Fix It' },
      customer_address: 'Delhi, Delhi'
    }
  ],
  reviews: [
    { rating: 5, created_at: '2024-01-11' },
    { rating: 4, created_at: '2024-02-11' }
  ],
  services: [
    { id: '1', name: 'Cleaning', service_categories: { name: 'Home Services' } },
    { id: '2', name: 'Plumbing', service_categories: { name: 'Repairs' } }
  ],
  service_categories: [
    { id: 'cat1', name: 'Home Services' },
    { id: 'cat2', name: 'Repairs' }
  ]
};

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase queries
    vi.mocked(supabase.from).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      mockResolvedValue: (data: any) => Promise.resolve({ data, error: null })
    } as any));

    // Setup specific table responses
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      const baseQuery = {
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };

      switch (table) {
        case 'profiles':
          return {
            ...baseQuery,
            mockResolvedValue: Promise.resolve({ data: mockAnalyticsData.profiles, error: null })
          } as any;
        case 'bookings':
          return {
            ...baseQuery,
            mockResolvedValue: Promise.resolve({ data: mockAnalyticsData.bookings, error: null })
          } as any;
        case 'reviews':
          return {
            ...baseQuery,
            mockResolvedValue: Promise.resolve({ data: mockAnalyticsData.reviews, error: null })
          } as any;
        case 'services':
          return {
            ...baseQuery,
            mockResolvedValue: Promise.resolve({ data: mockAnalyticsData.services, error: null })
          } as any;
        case 'service_categories':
          return {
            ...baseQuery,
            mockResolvedValue: Promise.resolve({ data: mockAnalyticsData.service_categories, error: null })
          } as any;
        default:
          return {
            ...baseQuery,
            mockResolvedValue: Promise.resolve({ data: [], error: null })
          } as any;
      }
    });
  });

  it('renders analytics dashboard with key metrics', async () => {
    render(<AdminAnalytics />);
    
    expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('Average Rating')).toBeInTheDocument();
    });
  });

  it('displays calculated metrics correctly', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Should show total users (3)
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Should show total revenue (3000)
      expect(screen.getByText('₹3,000')).toBeInTheDocument();
      
      // Should show total bookings (2)
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Should show average rating (4.5)
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  it('allows changing time range filter', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });
    
    const timeRangeSelect = screen.getByRole('combobox');
    fireEvent.click(timeRangeSelect);
    
    const sevenDaysOption = screen.getByText('Last 7 days');
    fireEvent.click(sevenDaysOption);
    
    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });
  });

  it('shows top categories and providers', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('Top Service Categories')).toBeInTheDocument();
      expect(screen.getByText('Top Providers')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Should trigger data refetch
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  it('exports analytics report', async () => {
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: mockCreateObjectURL
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL
    });
    
    // Mock document.createElement
    const mockLink = {
      href: '',
      download: '',
      click: mockClick
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });
    
    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);
    
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: "Success",
      description: "Analytics report exported successfully"
    });
  });

  it('switches between different analytics tabs', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
    
    // Click on Performance tab
    const performanceTab = screen.getByText('Performance');
    fireEvent.click(performanceTab);
    
    await waitFor(() => {
      expect(screen.getByText('User Distribution')).toBeInTheDocument();
      expect(screen.getByText('Booking Performance')).toBeInTheDocument();
    });
    
    // Click on Geographic tab
    const geographicTab = screen.getByText('Geographic');
    fireEvent.click(geographicTab);
    
    await waitFor(() => {
      expect(screen.getByText('Geographic Distribution')).toBeInTheDocument();
    });
    
    // Click on Trends tab
    const trendsTab = screen.getByText('Trends');
    fireEvent.click(trendsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Monthly Trends (Last 6 Months)')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      mockResolvedValue: Promise.resolve({ data: null, error: new Error('API Error') })
    } as any));
    
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to fetch analytics data"
      });
    });
  });

  it('shows loading state initially', () => {
    render(<AdminAnalytics />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-spin');
  });

  it('calculates growth rates correctly', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Should show growth indicators
      const growthElements = screen.getAllByText(/\d+\.\d+%/);
      expect(growthElements.length).toBeGreaterThan(0);
    });
  });
});