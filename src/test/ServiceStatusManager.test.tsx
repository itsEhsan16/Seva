import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ServiceStatusManager } from '@/components/ServiceStatusManager';
import { useProviderBookings } from '@/hooks/useProviderBookings';

// Mock dependencies
vi.mock('@/hooks/useProviderBookings');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockBookings = [
  {
    id: 'booking-1',
    booking_date: '2024-01-15',
    booking_time: '10:00',
    total_amount: 500,
    status: 'confirmed',
    customer_address: '123 Test Street',
    customer_notes: 'Please call before arriving',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
    service: { 
      name: 'House Cleaning', 
      duration_minutes: 120 
    },
    customer: { 
      full_name: 'Jane Customer', 
      phone: '1234567890' 
    }
  },
  {
    id: 'booking-2',
    booking_date: '2024-01-16',
    booking_time: '14:00',
    total_amount: 750,
    status: 'in_progress',
    customer_address: '456 Another Street',
    customer_notes: null,
    created_at: '2024-01-16T12:00:00Z',
    updated_at: '2024-01-16T13:00:00Z',
    service: { 
      name: 'Deep Cleaning', 
      duration_minutes: 180 
    },
    customer: { 
      full_name: 'John Customer', 
      phone: '0987654321' 
    }
  }
];

describe('ServiceStatusManager', () => {
  const mockUpdateBookingStatus = vi.fn();

  beforeEach(() => {
    vi.mocked(useProviderBookings).mockReturnValue({
      bookings: mockBookings,
      updateBookingStatus: mockUpdateBookingStatus,
    } as any);

    mockUpdateBookingStatus.mockResolvedValue({ error: null });
  });

  it('renders active services list', () => {
    render(<ServiceStatusManager />);
    
    expect(screen.getByText('Active Services')).toBeInTheDocument();
    expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Deep Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Jane Customer')).toBeInTheDocument();
    expect(screen.getByText('John Customer')).toBeInTheDocument();
  });

  it('displays booking details correctly', () => {
    render(<ServiceStatusManager />);
    
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('456 Another Street')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('₹750')).toBeInTheDocument();
  });

  it('shows status badges with correct styling', () => {
    render(<ServiceStatusManager />);
    
    const confirmedBadge = screen.getByText('confirmed');
    const inProgressBadge = screen.getByText('in progress');
    
    expect(confirmedBadge).toBeInTheDocument();
    expect(inProgressBadge).toBeInTheDocument();
  });

  it('selects booking when clicked', async () => {
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      expect(screen.getByText('Manage Service: House Cleaning')).toBeInTheDocument();
    });
  });

  it('displays customer notes when available', async () => {
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      expect(screen.getByText('Customer Notes')).toBeInTheDocument();
      expect(screen.getByText('Please call before arriving')).toBeInTheDocument();
    });
  });

  it('shows appropriate action buttons for confirmed booking', async () => {
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      expect(screen.getByText('Start Service')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('shows appropriate action buttons for in-progress booking', async () => {
    render(<ServiceStatusManager />);
    
    const secondBooking = screen.getByText('Deep Cleaning').closest('div');
    fireEvent.click(secondBooking!);
    
    await waitFor(() => {
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('updates booking status when action button is clicked', async () => {
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      const startButton = screen.getByText('Start Service');
      fireEvent.click(startButton);
    });
    
    expect(mockUpdateBookingStatus).toHaveBeenCalledWith('booking-1', 'in_progress', undefined);
  });

  it('includes provider notes when updating status', async () => {
    render(<ServiceStatusManager />);
    
    const secondBooking = screen.getByText('Deep Cleaning').closest('div');
    fireEvent.click(secondBooking!);
    
    await waitFor(() => {
      const notesTextarea = screen.getByPlaceholderText(/Add any notes about the service/);
      fireEvent.change(notesTextarea, { target: { value: 'Service completed successfully' } });
      
      const completeButton = screen.getByText('Mark Complete');
      fireEvent.click(completeButton);
    });
    
    expect(mockUpdateBookingStatus).toHaveBeenCalledWith('booking-2', 'completed', 'Service completed successfully');
  });

  it('displays service timeline', async () => {
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      expect(screen.getByText('Service Timeline')).toBeInTheDocument();
      expect(screen.getByText('Booking confirmed')).toBeInTheDocument();
    });
  });

  it('shows empty state when no active bookings', () => {
    vi.mocked(useProviderBookings).mockReturnValue({
      bookings: [],
      updateBookingStatus: mockUpdateBookingStatus,
    } as any);

    render(<ServiceStatusManager />);
    
    expect(screen.getByText('No active services at the moment.')).toBeInTheDocument();
  });

  it('handles booking status update errors', async () => {
    mockUpdateBookingStatus.mockResolvedValue({ error: 'Update failed' });
    
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      const startButton = screen.getByText('Start Service');
      fireEvent.click(startButton);
    });
    
    // Error handling would be tested through toast mock
    expect(mockUpdateBookingStatus).toHaveBeenCalled();
  });

  it('pre-selects booking when bookingId prop is provided', () => {
    render(<ServiceStatusManager bookingId="booking-1" />);
    
    expect(screen.getByText('Manage Service: House Cleaning')).toBeInTheDocument();
  });

  it('displays booking information in management panel', async () => {
    render(<ServiceStatusManager />);
    
    const firstBooking = screen.getByText('House Cleaning').closest('div');
    fireEvent.click(firstBooking!);
    
    await waitFor(() => {
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('Service Details')).toBeInTheDocument();
      expect(screen.getByText('Duration: 120 minutes')).toBeInTheDocument();
    });
  });

  it('filters only active bookings', () => {
    const allBookings = [
      ...mockBookings,
      {
        id: 'booking-3',
        booking_date: '2024-01-17',
        booking_time: '16:00',
        total_amount: 300,
        status: 'completed',
        customer_address: '789 Completed Street',
        customer_notes: null,
        created_at: '2024-01-17T14:00:00Z',
        updated_at: '2024-01-17T18:00:00Z',
        service: { name: 'Quick Clean', duration_minutes: 60 },
        customer: { full_name: 'Completed Customer', phone: '5555555555' }
      }
    ];

    vi.mocked(useProviderBookings).mockReturnValue({
      bookings: allBookings,
      updateBookingStatus: mockUpdateBookingStatus,
    } as any);

    render(<ServiceStatusManager />);
    
    // Should only show confirmed and in_progress bookings
    expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Deep Cleaning')).toBeInTheDocument();
    expect(screen.queryByText('Quick Clean')).not.toBeInTheDocument();
  });
});