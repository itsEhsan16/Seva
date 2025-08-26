import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProviderDashboard from '@/components/ProviderDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderServices } from '@/hooks/useProviderServices';
import { useProviderBookings } from '@/hooks/useProviderBookings';
import { useProviderStats } from '@/hooks/useProviderStats';
import { useProviderNotifications } from '@/hooks/useProviderNotifications';

// Mock the hooks
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useProviderServices');
vi.mock('@/hooks/useProviderBookings');
vi.mock('@/hooks/useProviderStats');
vi.mock('@/hooks/useProviderNotifications');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock child components
vi.mock('@/components/ProviderRegistration', () => ({
  ProviderRegistration: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="provider-registration">Provider Registration</div> : null
}));

vi.mock('@/components/ServiceForm', () => ({
  ServiceForm: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="service-form">Service Form</div> : null
}));

vi.mock('@/components/ProviderAnalytics', () => ({
  ProviderAnalytics: () => <div data-testid="provider-analytics">Analytics</div>
}));

vi.mock('@/components/ServiceStatusManager', () => ({
  ServiceStatusManager: () => <div data-testid="service-status-manager">Service Status Manager</div>
}));

const mockProfile = {
  id: 'provider-1',
  full_name: 'John Provider',
  role: 'provider' as const,
  verification_status: 'approved' as const,
};

const mockServices = [
  {
    id: 'service-1',
    name: 'House Cleaning',
    description: 'Professional house cleaning service',
    price: 500,
    duration_minutes: 120,
    category: { name: 'Cleaning', icon: '🧹' },
    total_bookings: 15,
    total_earnings: 7500,
    average_rating: 4.5,
    image_url: '/test-image.jpg'
  }
];

const mockBookings = [
  {
    id: 'booking-1',
    booking_date: '2024-01-15',
    booking_time: '10:00',
    total_amount: 500,
    status: 'confirmed',
    customer_address: '123 Test Street',
    service: { name: 'House Cleaning', duration_minutes: 120 },
    customer: { full_name: 'Jane Customer', phone: '1234567890' }
  }
];

const mockStats = {
  total_services: 3,
  total_bookings: 25,
  completed_bookings: 20,
  total_earnings: 12500,
  average_rating: 4.3,
  total_reviews: 18,
  monthly_earnings: 3500,
  monthly_bookings: 8
};

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'new_booking' as const,
    title: 'New Booking',
    message: 'You have a new booking for House Cleaning',
    is_read: false,
    created_at: '2024-01-15T10:00:00Z'
  }
];

describe('ProviderDashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      profile: mockProfile,
      refreshProfile: vi.fn(),
    } as any);

    vi.mocked(useProviderServices).mockReturnValue({
      services: mockServices,
      loading: false,
      deleteService: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    vi.mocked(useProviderBookings).mockReturnValue({
      bookings: mockBookings,
      loading: false,
      updateBookingStatus: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    vi.mocked(useProviderStats).mockReturnValue({
      stats: mockStats,
      loading: false,
    } as any);

    vi.mocked(useProviderNotifications).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    } as any);
  });

  it('renders provider dashboard with correct header', () => {
    render(<ProviderDashboard />);
    
    expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, John Provider')).toBeInTheDocument();
  });

  it('displays notification badge when there are unread notifications', () => {
    render(<ProviderDashboard />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Notification count
  });

  it('shows all navigation tabs', () => {
    render(<ProviderDashboard />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Service Status')).toBeInTheDocument();
    expect(screen.getByText('Payouts')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('displays stats cards in overview tab', () => {
    render(<ProviderDashboard />);
    
    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Monthly Earnings')).toBeInTheDocument();
    expect(screen.getByText('₹3,500')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });

  it('switches to analytics tab when clicked', async () => {
    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Analytics'));
    
    await waitFor(() => {
      expect(screen.getByTestId('provider-analytics')).toBeInTheDocument();
    });
  });

  it('switches to service status tab when clicked', async () => {
    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Service Status'));
    
    await waitFor(() => {
      expect(screen.getByTestId('service-status-manager')).toBeInTheDocument();
    });
  });

  it('opens service form when add service button is clicked', async () => {
    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Add New Service'));
    
    await waitFor(() => {
      expect(screen.getByTestId('service-form')).toBeInTheDocument();
    });
  });

  it('displays services in services tab', async () => {
    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Services'));
    
    await waitFor(() => {
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Bookings count
    });
  });

  it('displays bookings in bookings tab', async () => {
    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Bookings'));
    
    await waitFor(() => {
      expect(screen.getByText('Jane Customer')).toBeInTheDocument();
      expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    });
  });

  it('shows notifications dropdown when bell icon is clicked', async () => {
    render(<ProviderDashboard />);
    
    // Find the bell button by its notification count badge
    const bellButton = screen.getByRole('button', { name: '1' });
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('New Booking')).toBeInTheDocument();
      expect(screen.getByText('You have a new booking for House Cleaning')).toBeInTheDocument();
    });
  });

  it('handles booking status updates', async () => {
    const mockUpdateBookingStatus = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(useProviderBookings).mockReturnValue({
      bookings: [{
        ...mockBookings[0],
        status: 'pending'
      }],
      loading: false,
      updateBookingStatus: mockUpdateBookingStatus,
    } as any);

    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Bookings'));
    
    await waitFor(() => {
      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);
    });

    expect(mockUpdateBookingStatus).toHaveBeenCalledWith('booking-1', 'confirmed');
  });

  it('shows provider registration for non-provider users', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { ...mockProfile, role: 'customer' },
      refreshProfile: vi.fn(),
    } as any);

    render(<ProviderDashboard />);
    
    expect(screen.getByText('Become a Service Provider')).toBeInTheDocument();
    expect(screen.getByText('Apply to Become Provider')).toBeInTheDocument();
  });

  it('shows pending verification message for pending providers', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { ...mockProfile, verification_status: 'pending' },
      refreshProfile: vi.fn(),
    } as any);

    render(<ProviderDashboard />);
    
    expect(screen.getByText('Application Under Review')).toBeInTheDocument();
  });

  it('handles service deletion', async () => {
    const mockDeleteService = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(useProviderServices).mockReturnValue({
      services: mockServices,
      loading: false,
      deleteService: mockDeleteService,
    } as any);

    render(<ProviderDashboard />);
    
    fireEvent.click(screen.getByText('Services'));
    
    await waitFor(() => {
      // Look for the trash icon button
      const deleteButton = document.querySelector('svg.lucide-trash-2')?.closest('button');
      expect(deleteButton).toBeInTheDocument();
      fireEvent.click(deleteButton!);
    });

    expect(mockDeleteService).toHaveBeenCalledWith('service-1');
  });
});