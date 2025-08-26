import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedBookingForm from '@/components/EnhancedBookingForm';
import { useBooking } from '@/hooks/useBooking';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock the useBooking hook
vi.mock('@/hooks/useBooking', () => ({
  useBooking: vi.fn()
}));

// Mock date-fns to avoid timezone issues in tests
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
    if (formatStr === 'EEEE, MMMM d, yyyy') return 'Monday, January 15, 2024';
    if (formatStr === 'EEEE, MMM d') return 'Mon, Jan 15';
    return '2024-01-15';
  }),
  addDays: vi.fn((date, days) => new Date(2024, 0, 15 + days))
}));

describe('EnhancedBookingForm', () => {
  const mockUseBooking = {
    loading: false,
    submitting: false,
    availableSlots: [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '11:00', available: false, reason: 'Already booked' },
      { time: '14:00', available: true }
    ],
    alternatives: [],
    conflicts: [],
    checkAvailability: vi.fn(),
    getTimeSlots: vi.fn(),
    getAlternatives: vi.fn(),
    createBooking: vi.fn(),
    createRecurringBooking: vi.fn()
  };

  const defaultProps = {
    serviceId: 'service-1',
    providerId: 'provider-1',
    serviceName: 'House Cleaning',
    serviceDuration: 120,
    servicePrice: 2500,
    onBookingSuccess: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBooking).mockReturnValue(mockUseBooking);
  });

  it('should render the booking form with service information', () => {
    render(<EnhancedBookingForm {...defaultProps} />);

    expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Duration: 120 minutes')).toBeInTheDocument();
    expect(screen.getByText('₹2500')).toBeInTheDocument();
    expect(screen.getByText('Select Date')).toBeInTheDocument();
    expect(screen.getByText('Select Time')).toBeInTheDocument();
  });

  it('should load time slots when date is selected', async () => {
    const user = userEvent.setup();
    render(<EnhancedBookingForm {...defaultProps} />);

    const dateSelect = screen.getByRole('combobox');
    await user.selectOptions(dateSelect, '2024-01-15');

    await waitFor(() => {
      expect(mockUseBooking.getTimeSlots).toHaveBeenCalledWith('provider-1', '2024-01-15', 120);
    });
  });

  it('should display available time slots', () => {
    render(<EnhancedBookingForm {...defaultProps} />);

    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('should disable unavailable time slots', () => {
    render(<EnhancedBookingForm {...defaultProps} />);

    const unavailableSlot = screen.getByText('11:00').closest('button');
    expect(unavailableSlot).toBeDisabled();
    expect(screen.getByText('Already booked')).toBeInTheDocument();
  });

  it('should check availability when time is selected', async () => {
    const user = userEvent.setup();
    render(<EnhancedBookingForm {...defaultProps} />);

    // First select a date
    const dateSelect = screen.getByRole('combobox');
    await user.selectOptions(dateSelect, '2024-01-15');

    // Then select a time
    const timeSlot = screen.getByText('09:00').closest('button');
    await user.click(timeSlot!);

    await waitFor(() => {
      expect(mockUseBooking.checkAvailability).toHaveBeenCalledWith('provider-1', '2024-01-15', '09:00', 120);
    });
  });

  it('should show recurring booking options when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<EnhancedBookingForm {...defaultProps} />);

    const recurringCheckbox = screen.getByLabelText('Make this a recurring booking');
    await user.click(recurringCheckbox);

    expect(screen.getByText('Recurring Pattern')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('should show days of week selection for weekly/biweekly patterns', async () => {
    const user = userEvent.setup();
    render(<EnhancedBookingForm {...defaultProps} />);

    // Enable recurring booking
    const recurringCheckbox = screen.getByLabelText('Make this a recurring booking');
    await user.click(recurringCheckbox);

    // Select weekly pattern
    const patternSelect = screen.getByRole('combobox', { name: /recurring pattern/i });
    await user.click(patternSelect);
    await user.click(screen.getByText('Weekly'));

    expect(screen.getByText('Days of Week (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Mon')).toBeInTheDocument();
    expect(screen.getByLabelText('Tue')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<EnhancedBookingForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /book service/i });
    await user.click(submitButton);

    // Should not call booking functions without required fields
    expect(mockUseBooking.createBooking).not.toHaveBeenCalled();
  });

  it('should submit booking with correct data', async () => {
    const user = userEvent.setup();
    mockUseBooking.checkAvailability.mockResolvedValue({ available: true, conflicts: [] });
    mockUseBooking.createBooking.mockResolvedValue({ success: true, bookingId: 'booking-1' });

    // Mock availability status
    const mockUseBookingWithAvailability = {
      ...mockUseBooking,
      availabilityStatus: 'available'
    };
    vi.mocked(useBooking).mockReturnValue(mockUseBookingWithAvailability as any);

    render(<EnhancedBookingForm {...defaultProps} />);

    // Fill in required fields
    const dateSelect = screen.getByRole('combobox');
    await user.selectOptions(dateSelect, '2024-01-15');

    const timeSlot = screen.getByText('09:00').closest('button');
    await user.click(timeSlot!);

    const addressTextarea = screen.getByPlaceholderText(/enter the complete address/i);
    await user.type(addressTextarea, '123 Test Street, Test City');

    // Wait for availability check
    await waitFor(() => {
      expect(mockUseBooking.checkAvailability).toHaveBeenCalled();
    });

    const submitButton = screen.getByRole('button', { name: /book service/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUseBooking.createBooking).toHaveBeenCalledWith({
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '09:00',
        customerAddress: '123 Test Street, Test City',
        customerNotes: '',
        isRecurring: false,
        recurringType: undefined,
        recurringEndDate: '',
        recurringDays: []
      });
    });
  });

  it('should submit recurring booking with correct data', async () => {
    const user = userEvent.setup();
    mockUseBooking.checkAvailability.mockResolvedValue({ available: true, conflicts: [] });
    mockUseBooking.createRecurringBooking.mockResolvedValue({ 
      success: true, 
      bookingIds: ['booking-1', 'booking-2'], 
      errors: [] 
    });

    // Mock availability status
    const mockUseBookingWithAvailability = {
      ...mockUseBooking,
      availabilityStatus: 'available'
    };
    vi.mocked(useBooking).mockReturnValue(mockUseBookingWithAvailability as any);

    render(<EnhancedBookingForm {...defaultProps} />);

    // Fill in required fields
    const dateSelect = screen.getByRole('combobox');
    await user.selectOptions(dateSelect, '2024-01-15');

    const timeSlot = screen.getByText('09:00').closest('button');
    await user.click(timeSlot!);

    const addressTextarea = screen.getByPlaceholderText(/enter the complete address/i);
    await user.type(addressTextarea, '123 Test Street, Test City');

    // Enable recurring booking
    const recurringCheckbox = screen.getByLabelText('Make this a recurring booking');
    await user.click(recurringCheckbox);

    // Set recurring pattern
    const patternSelect = screen.getByRole('combobox', { name: /recurring pattern/i });
    await user.click(patternSelect);
    await user.click(screen.getByText('Weekly'));

    // Set end date
    const endDateInput = screen.getByLabelText('End Date');
    await user.type(endDateInput, '2024-02-15');

    // Wait for availability check
    await waitFor(() => {
      expect(mockUseBooking.checkAvailability).toHaveBeenCalled();
    });

    const submitButton = screen.getByRole('button', { name: /book service/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUseBooking.createRecurringBooking).toHaveBeenCalledWith({
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '09:00',
        customerAddress: '123 Test Street, Test City',
        customerNotes: '',
        isRecurring: true,
        recurringType: 'weekly',
        recurringEndDate: '2024-02-15',
        recurringDays: []
      });
    });
  });

  it('should show alternatives when slot is unavailable', async () => {
    const mockUseBookingWithAlternatives = {
      ...mockUseBooking,
      alternatives: [
        {
          date: '2024-01-16',
          time: '09:00',
          provider_id: 'provider-2',
          provider_name: 'Alternative Provider'
        }
      ]
    };
    vi.mocked(useBooking).mockReturnValue(mockUseBookingWithAlternatives);

    render(<EnhancedBookingForm {...defaultProps} />);

    expect(screen.getByText('Alternative Time Slots')).toBeInTheDocument();
    expect(screen.getByText('Alternative Provider')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<EnhancedBookingForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should call onBookingSuccess when booking is successful', async () => {
    const user = userEvent.setup();
    mockUseBooking.checkAvailability.mockResolvedValue({ available: true, conflicts: [] });
    mockUseBooking.createBooking.mockResolvedValue({ success: true, bookingId: 'booking-1' });

    // Mock availability status
    const mockUseBookingWithAvailability = {
      ...mockUseBooking,
      availabilityStatus: 'available'
    };
    vi.mocked(useBooking).mockReturnValue(mockUseBookingWithAvailability as any);

    render(<EnhancedBookingForm {...defaultProps} />);

    // Fill in required fields and submit
    const dateSelect = screen.getByRole('combobox');
    await user.selectOptions(dateSelect, '2024-01-15');

    const timeSlot = screen.getByText('09:00').closest('button');
    await user.click(timeSlot!);

    const addressTextarea = screen.getByPlaceholderText(/enter the complete address/i);
    await user.type(addressTextarea, '123 Test Street, Test City');

    await waitFor(() => {
      expect(mockUseBooking.checkAvailability).toHaveBeenCalled();
    });

    const submitButton = screen.getByRole('button', { name: /book service/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onBookingSuccess).toHaveBeenCalledWith(['booking-1']);
    });
  });
});