import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  checkBookingConflicts, 
  getAvailableTimeSlots, 
  findAlternativeSlots,
  generateRecurringDates,
  createRecurringBookings
} from '@/lib/bookingUtils';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              single: vi.fn(),
              then: vi.fn()
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

describe('bookingUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkBookingConflicts', () => {
    it('should detect time conflicts correctly', async () => {
      const mockBookings = [
        {
          id: '1',
          booking_date: '2024-01-15',
          booking_time: '10:00:00',
          services: { name: 'Test Service', duration_minutes: 60 }
        }
      ];

      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockBookings, error: null }))
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await checkBookingConflicts('provider-1', '2024-01-15', '10:30:00', 60);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].service_name).toBe('Test Service');
    });

    it('should return no conflicts for non-overlapping times', async () => {
      const mockBookings = [
        {
          id: '1',
          booking_date: '2024-01-15',
          booking_time: '10:00:00',
          services: { name: 'Test Service', duration_minutes: 60 }
        }
      ];

      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockBookings, error: null }))
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await checkBookingConflicts('provider-1', '2024-01-15', '12:00:00', 60);

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: null, error: new Error('Database error') }))
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await checkBookingConflicts('provider-1', '2024-01-15', '10:00:00', 60);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should generate available time slots based on provider availability', async () => {
      const mockAvailability = [
        {
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: true
        }
      ];

      const mockBookings = [];

      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockAvailability, error: null }))
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValueOnce(mockSupabaseChain as any);
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockBookings, error: null }))
            }))
          }))
        }))
      } as any);

      const result = await getAvailableTimeSlots('provider-1', '2024-12-31', 60);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].time).toBe('09:00');
      expect(result[0].available).toBe(false); // Should be false because it's in the past
      expect(result[0].reason).toBe('Past time');
    });

    it('should mark slots as unavailable when they conflict with existing bookings', async () => {
      const mockAvailability = [
        {
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: true
        }
      ];

      const mockBookings = [
        {
          booking_time: '10:00:00',
          services: { duration_minutes: 60 }
        }
      ];

      const mockSupabaseChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockAvailability, error: null }))
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValueOnce(mockSupabaseChain as any);
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockBookings, error: null }))
            }))
          }))
        }))
      } as any);

      // Use a future date to avoid "Past time" issue
      const futureDate = '2025-12-31';
      const result = await getAvailableTimeSlots('provider-1', futureDate, 60);

      const tenAmSlot = result.find(slot => slot.time === '10:00');
      expect(tenAmSlot?.available).toBe(false);
      expect(tenAmSlot?.reason).toBe('Already booked');
    });
  });

  describe('generateRecurringDates', () => {
    it('should generate weekly recurring dates correctly', () => {
      const startDate = '2024-01-15'; // Monday
      const endDate = '2024-02-15';
      const recurringType = 'weekly';
      const recurringDays = [1]; // Monday

      const result = generateRecurringDates(startDate, endDate, recurringType, recurringDays);

      expect(result).toContain('2024-01-15');
      expect(result).toContain('2024-01-22');
      expect(result).toContain('2024-01-29');
      expect(result).toContain('2024-02-05');
      expect(result).toContain('2024-02-12');
      expect(result.length).toBe(5);
    });

    it('should generate biweekly recurring dates correctly', () => {
      const startDate = '2024-01-15';
      const endDate = '2024-03-15';
      const recurringType = 'biweekly';
      const recurringDays = [1]; // Monday

      const result = generateRecurringDates(startDate, endDate, recurringType, recurringDays);

      expect(result).toContain('2024-01-15');
      expect(result).toContain('2024-01-29');
      expect(result).toContain('2024-02-12');
      expect(result).toContain('2024-02-26');
      expect(result).toContain('2024-03-11');
      expect(result.length).toBe(5);
    });

    it('should generate monthly recurring dates correctly', () => {
      const startDate = '2024-01-15';
      const endDate = '2024-04-15';
      const recurringType = 'monthly';

      const result = generateRecurringDates(startDate, endDate, recurringType);

      expect(result).toContain('2024-01-15');
      expect(result).toContain('2024-02-15');
      expect(result).toContain('2024-03-15');
      expect(result).toContain('2024-04-15');
      expect(result.length).toBe(4);
    });

    it('should handle multiple days for weekly recurring', () => {
      const startDate = '2024-01-15'; // Monday
      const endDate = '2024-01-22';
      const recurringType = 'weekly';
      const recurringDays = [1, 3, 5]; // Monday, Wednesday, Friday

      const result = generateRecurringDates(startDate, endDate, recurringType, recurringDays);

      expect(result).toContain('2024-01-15'); // Monday
      expect(result).toContain('2024-01-17'); // Wednesday
      expect(result).toContain('2024-01-19'); // Friday
      expect(result).toContain('2024-01-22'); // Next Monday
      expect(result.length).toBe(4);
    });
  });

  describe('createRecurringBookings', () => {
    it('should create multiple bookings successfully', async () => {
      const mockBookingData = {
        customer_id: 'customer-1',
        provider_id: 'provider-1',
        service_id: 'service-1',
        booking_time: '10:00:00',
        customer_address: 'Test Address',
        total_amount: 100,
        status: 'pending',
        payment_status: 'pending',
        duration_minutes: 60
      };

      const recurringDates = ['2024-01-15', '2024-01-22', '2024-01-29'];

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'bookings' && callCount % 2 === 1) {
          // Odd calls are for conflict checks
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
              }))
            }))
          } as any;
        } else if (table === 'bookings' && callCount % 2 === 0) {
          // Even calls are for inserts
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ 
                  data: { id: `booking-${callCount / 2}` }, 
                  error: null 
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const result = await createRecurringBookings(mockBookingData, recurringDates);

      expect(result.success).toBe(true);
      expect(result.bookingIds.length).toBe(3);
      expect(result.errors.length).toBe(0);
    });

    it('should handle conflicts and continue with non-conflicting bookings', async () => {
      const mockBookingData = {
        customer_id: 'customer-1',
        provider_id: 'provider-1',
        service_id: 'service-1',
        booking_time: '10:00:00',
        customer_address: 'Test Address',
        total_amount: 100,
        status: 'pending',
        payment_status: 'pending',
        duration_minutes: 60
      };

      const recurringDates = ['2024-01-15', '2024-01-22'];

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'bookings' && callCount === 1) {
          // First conflict check - has conflict
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => Promise.resolve({ 
                    data: [{ id: 'existing-booking' }], 
                    error: null 
                  }))
                }))
              }))
            }))
          } as any;
        } else if (table === 'bookings' && callCount === 2) {
          // Second conflict check - no conflict
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
              }))
            }))
          } as any;
        } else if (table === 'bookings' && callCount === 3) {
          // Insert for second date
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ 
                  data: { id: 'booking-2' }, 
                  error: null 
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const result = await createRecurringBookings(mockBookingData, recurringDates);

      expect(result.success).toBe(true);
      expect(result.bookingIds.length).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Conflict found for 2024-01-15');
    });
  });
});