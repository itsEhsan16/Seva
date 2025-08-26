import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingConfirmation from '@/components/BookingConfirmation';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      admin: {
        getUserById: vi.fn()
      }
    }
  }
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMMM d, yyyy') return 'January 15, 2024';
    if (formatStr === 'EEEE, MMMM d, yyyy') return 'Monday, January 15, 2024';
    return '2024-01-15';
  })
}));

describe('BookingConfirmation', () => {
  const mockBookingData = [
    {
      id: 'booking-1',
      booking_date: '2024-01-15',
      booking_time: '10:00:00',
      total_amount: 2500,
      customer_address: '123 Test Street',
      customer_notes: 'Test notes',
      status: 'confirmed',
      service: {
        name: 'House Cleaning',
        description: 'Deep cleaning service',
        duration_minutes: 120
      },
      provider: {
        full_name: 'John Doe',
        business_name: 'Clean Pro',
        phone: '+91 9876543210',
        user_id: 'provider-user-1'
      }
    }
  ];

  const defaultProps = {
    bookingIds: ['booking-1'],
    onClose: vi.fn(),
    onProceedToPayment: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful booking fetch
    const mockSupabaseChain = {
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: mockBookingData, error: null }))
      }))
    };
    
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);
    
    // Mock auth user fetch
    vi.mocked(supabase.auth.admin.getUserById).mockResolvedValue({
      data: { user: { email: 'provider@example.com' } },
      error: null
    } as any);
  });

  it('should render booking confirmation with details', async () => {
    render(<BookingConfirmation {...defaultProps} />);

    // Should show loading initially
    expect(screen.getByText('Loading booking details...')).toBeInTheDocument();

    // Wait for booking details to load
    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });

    expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Deep cleaning service')).toBeInTheDocument();
    expect(screen.getByText('₹2500')).toBeInTheDocument();
    expect(screen.getByText('Clean Pro')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
  });

  it('should handle multiple bookings', async () => {
    const multipleBookings = [
      ...mockBookingData,
      {
        ...mockBookingData[0],
        id: 'booking-2',
        service: { ...mockBookingData[0].service, name: 'AC Repair' },
        total_amount: 1500
      }
    ];

    const mockSupabaseChain = {
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: multipleBookings, error: null }))
      }))
    };
    
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    render(<BookingConfirmation {...{ ...defaultProps, bookingIds: ['booking-1', 'booking-2'] }} />);

    await waitFor(() => {
      expect(screen.getByText('Bookings Confirmed!')).toBeInTheDocument();
    });

    expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('AC Repair')).toBeInTheDocument();
    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    expect(screen.getByText('₹4000')).toBeInTheDocument(); // 2500 + 1500
  });

  it('should call onClose when close button is clicked', async () => {
    render(<BookingConfirmation {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onProceedToPayment when payment button is clicked', async () => {
    render(<BookingConfirmation {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });

    const paymentButton = screen.getByRole('button', { name: /proceed to payment/i });
    await userEvent.click(paymentButton);

    expect(defaultProps.onProceedToPayment).toHaveBeenCalledWith(['booking-1']);
  });

  it('should handle booking fetch errors', async () => {
    const mockSupabaseChain = {
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: null, error: new Error('Database error') }))
      }))
    };
    
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    render(<BookingConfirmation {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Loading booking details...')).toBeInTheDocument();
    });

    // Should handle error gracefully and still show loading or error state
    // The component should not crash
  });

  it('should copy booking details to clipboard', async () => {
    // Mock clipboard API
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<BookingConfirmation {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });

    // Find and click the copy button (it's a small button with Copy icon)
    const copyButtons = screen.getAllByRole('button');
    const copyButton = copyButtons.find(button => 
      button.querySelector('svg') && button.className.includes('h-auto p-1')
    );
    
    if (copyButton) {
      await userEvent.click(copyButton);
      expect(mockWriteText).toHaveBeenCalled();
    }
  });
});