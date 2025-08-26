import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBooking } from '@/hooks/useBooking';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('@/lib/bookingUtils', () => ({
  checkBookingConflicts: vi.fn(),
  getAvailableTimeSlots: vi.fn(),
  findAlternativeSlots: vi.fn(),
  generateRecurringDates: vi.fn(),
  createRecurringBookings: vi.fn()
}));

describe('useBooking', () => {
  const mockToast = vi.fn();
  const mockProfile = { id: 'user-1', user_id: 'auth-user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(useAuth).mockReturnValue({ profile: mockProfile } as any);
  });

  describe('checkAvailability', () => {
    it('should check availability and return result', async () => {
      const { checkBookingConflicts } = await import('@/lib/bookingUtils');
      vi.mocked(checkBookingConflicts).mockResolvedValue({
        hasConflict: false,
        conflicts: []
      });

      const { result } = renderHook(() => useBooking());

      let availabilityResult;
      await act(async () => {
        availabilityResult = await result.current.checkAvailability(
          'provider-1',
          '2024-01-15',
          '10:00:00',
          60
        );
      });

      expect(availabilityResult).toEqual({
        available: true,
        conflicts: []
      });
      expect(checkBookingConflicts).toHaveBeenCalledWith(
        'provider-1',
        '2024-01-15',
        '10:00:00',
        60
      );
    });

    it('should handle conflicts correctly', async () => {
      const { checkBookingConflicts } = await import('@/lib/bookingUtils');
      const mockConflicts = [
        {
          id: 'booking-1',
          booking_date: '2024-01-15',
          booking_time: '10:00:00',
          service_name: 'Test Service',
          duration_minutes: 60
        }
      ];

      vi.mocked(checkBookingConflicts).mockResolvedValue({
        hasConflict: true,
        conflicts: mockConflicts
      });

      const { result } = renderHook(() => useBooking());

      let availabilityResult;
      await act(async () => {
        availabilityResult = await result.current.checkAvailability(
          'provider-1',
          '2024-01-15',
          '10:00:00',
          60
        );
      });

      expect(availabilityResult).toEqual({
        available: false,
        conflicts: mockConflicts
      });
      expect(result.current.conflicts).toEqual(mockConflicts);
    });
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const { checkBookingConflicts } = await import('@/lib/bookingUtils');
      vi.mocked(checkBookingConflicts).mockResolvedValue({
        hasConflict: false,
        conflicts: []
      });

      const mockService = { price: 100, duration_minutes: 60 };
      const mockBooking = { id: 'booking-1' };

      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockService, error: null }))
          }))
        }))
      };

      const mockInsertChain = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockBooking, error: null }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValueOnce(mockSupabaseChain as any);
      vi.mocked(supabase.from).mockReturnValueOnce(mockInsertChain as any);

      const { result } = renderHook(() => useBooking());

      const bookingData = {
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '10:00:00',
        customerAddress: 'Test Address',
        customerNotes: 'Test notes',
        isRecurring: false
      };

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.createBooking(bookingData);
      });

      expect(bookingResult).toEqual({
        success: true,
        bookingId: 'booking-1'
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Booking Created",
        description: "Your booking has been created successfully!",
      });
    });

    it('should handle booking conflicts', async () => {
      const { checkBookingConflicts } = await import('@/lib/bookingUtils');
      vi.mocked(checkBookingConflicts).mockResolvedValue({
        hasConflict: true,
        conflicts: []
      });

      const { result } = renderHook(() => useBooking());

      const bookingData = {
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '10:00:00',
        customerAddress: 'Test Address',
        isRecurring: false
      };

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.createBooking(bookingData);
      });

      expect(bookingResult).toEqual({
        success: false,
        bookingId: null
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Booking Conflict",
        description: "This time slot is no longer available. Please choose another time.",
        variant: "destructive"
      });
    });

    it('should require authentication', async () => {
      vi.mocked(useAuth).mockReturnValue({ profile: null } as any);

      const { result } = renderHook(() => useBooking());

      const bookingData = {
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '10:00:00',
        customerAddress: 'Test Address',
        isRecurring: false
      };

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.createBooking(bookingData);
      });

      expect(bookingResult).toEqual({
        success: false,
        bookingId: null
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Authentication Required",
        description: "Please sign in to create a booking.",
        variant: "destructive"
      });
    });
  });

  describe('createRecurringBooking', () => {
    it('should create recurring bookings successfully', async () => {
      const { generateRecurringDates, createRecurringBookings } = await import('@/lib/bookingUtils');
      
      vi.mocked(generateRecurringDates).mockReturnValue([
        '2024-01-15',
        '2024-01-22',
        '2024-01-29'
      ]);

      vi.mocked(createRecurringBookings).mockResolvedValue({
        success: true,
        bookingIds: ['booking-1', 'booking-2', 'booking-3'],
        errors: []
      });

      const mockService = { price: 100, duration_minutes: 60 };
      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockService, error: null }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useBooking());

      const bookingData = {
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '10:00:00',
        customerAddress: 'Test Address',
        isRecurring: true,
        recurringType: 'weekly' as const,
        recurringEndDate: '2024-01-29',
        recurringDays: [1]
      };

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.createRecurringBooking(bookingData);
      });

      expect(bookingResult).toEqual({
        success: true,
        bookingIds: ['booking-1', 'booking-2', 'booking-3'],
        errors: []
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Recurring Bookings Created",
        description: "Successfully created 3 bookings.",
      });
    });

    it('should handle partial success with some conflicts', async () => {
      const { generateRecurringDates, createRecurringBookings } = await import('@/lib/bookingUtils');
      
      vi.mocked(generateRecurringDates).mockReturnValue([
        '2024-01-15',
        '2024-01-22'
      ]);

      vi.mocked(createRecurringBookings).mockResolvedValue({
        success: true,
        bookingIds: ['booking-1'],
        errors: ['Conflict found for 2024-01-22 at 10:00:00']
      });

      const mockService = { price: 100, duration_minutes: 60 };
      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockService, error: null }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useBooking());

      const bookingData = {
        serviceId: 'service-1',
        providerId: 'provider-1',
        bookingDate: '2024-01-15',
        bookingTime: '10:00:00',
        customerAddress: 'Test Address',
        isRecurring: true,
        recurringType: 'weekly' as const,
        recurringEndDate: '2024-01-22',
        recurringDays: [1]
      };

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.createRecurringBooking(bookingData);
      });

      expect(bookingResult).toEqual({
        success: true,
        bookingIds: ['booking-1'],
        errors: ['Conflict found for 2024-01-22 at 10:00:00']
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Recurring Bookings Created",
        description: "Successfully created 1 bookings.",
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Some Bookings Failed",
        description: "1 bookings could not be created due to conflicts.",
        variant: "destructive"
      });
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      const mockSupabaseChain = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useBooking());

      let cancelResult;
      await act(async () => {
        cancelResult = await result.current.cancelBooking('booking-1', 'Changed plans');
      });

      expect(cancelResult).toEqual({ success: true });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    });

    it('should handle cancellation errors', async () => {
      const mockSupabaseChain = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: new Error('Database error') }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useBooking());

      let cancelResult;
      await act(async () => {
        cancelResult = await result.current.cancelBooking('booking-1');
      });

      expect(cancelResult).toEqual({ success: false });
      expect(mockToast).toHaveBeenCalledWith({
        title: "Cancellation Failed",
        description: "Database error",
        variant: "destructive"
      });
    });
  });
});