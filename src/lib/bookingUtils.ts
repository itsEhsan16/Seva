import { supabase } from "@/integrations/supabase/client";
import { addDays, addWeeks, addMonths, format, isSameDay, parseISO } from "date-fns";

export interface BookingConflict {
  id: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  duration_minutes: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface AlternativeSlot {
  date: string;
  time: string;
  provider_id: string;
  provider_name: string;
}

/**
 * Check for booking conflicts for a specific provider on a given date and time
 */
export const checkBookingConflicts = async (
  providerId: string,
  date: string,
  time: string,
  duration: number = 60
): Promise<{ hasConflict: boolean; conflicts: BookingConflict[] }> => {
  try {
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        services(name, duration_minutes)
      `)
      .eq('provider_id', providerId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed', 'in_progress']);

    if (error) throw error;

    const conflicts: BookingConflict[] = [];
    const requestedStartTime = parseTimeToMinutes(time);
    const requestedEndTime = requestedStartTime + duration;

    for (const booking of existingBookings || []) {
      const existingStartTime = parseTimeToMinutes(booking.booking_time);
      const existingDuration = booking.services?.duration_minutes || 60;
      const existingEndTime = existingStartTime + existingDuration;

      // Check for time overlap
      if (
        (requestedStartTime < existingEndTime && requestedEndTime > existingStartTime)
      ) {
        conflicts.push({
          id: booking.id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          service_name: booking.services?.name || 'Unknown Service',
          duration_minutes: existingDuration
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  } catch (error) {
    console.error('Error checking booking conflicts:', error);
    return { hasConflict: true, conflicts: [] };
  }
};

/**
 * Get available time slots for a provider on a specific date
 */
export const getAvailableTimeSlots = async (
  providerId: string,
  date: string,
  serviceDuration: number = 60
): Promise<TimeSlot[]> => {
  try {
    // Get provider availability for the day of week
    const dayOfWeek = new Date(date).getDay();
    
    const { data: availability, error: availabilityError } = await supabase
      .from('provider_availability')
      .select('start_time, end_time, is_available')
      .eq('provider_id', providerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true);

    if (availabilityError) throw availabilityError;

    if (!availability || availability.length === 0) {
      // Default business hours if no specific availability set
      availability.push({
        start_time: '09:00:00',
        end_time: '18:00:00',
        is_available: true
      });
    }

    // Get existing bookings for the date
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_time, services(duration_minutes)')
      .eq('provider_id', providerId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed', 'in_progress']);

    if (bookingsError) throw bookingsError;

    const timeSlots: TimeSlot[] = [];
    
    for (const slot of availability) {
      const startMinutes = parseTimeToMinutes(slot.start_time);
      const endMinutes = parseTimeToMinutes(slot.end_time);
      
      // Generate 30-minute intervals
      for (let minutes = startMinutes; minutes <= endMinutes - serviceDuration; minutes += 30) {
        const timeString = formatMinutesToTime(minutes);
        const slotEndTime = minutes + serviceDuration;
        
        // Check if this slot conflicts with existing bookings
        let isAvailable = true;
        let reason = '';
        
        for (const booking of existingBookings || []) {
          const bookingStartTime = parseTimeToMinutes(booking.booking_time);
          const bookingDuration = booking.services?.duration_minutes || 60;
          const bookingEndTime = bookingStartTime + bookingDuration;
          
          if (minutes < bookingEndTime && slotEndTime > bookingStartTime) {
            isAvailable = false;
            reason = 'Already booked';
            break;
          }
        }
        
        // Check if slot is in the past
        const now = new Date();
        const slotDateTime = new Date(`${date}T${timeString}`);
        if (slotDateTime <= now) {
          isAvailable = false;
          reason = 'Past time';
        }
        
        timeSlots.push({
          time: timeString,
          available: isAvailable,
          reason: isAvailable ? undefined : reason
        });
      }
    }
    
    return timeSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    return [];
  }
};

/**
 * Find alternative booking slots when the requested slot is not available
 */
export const findAlternativeSlots = async (
  serviceId: string,
  originalDate: string,
  originalTime: string,
  serviceDuration: number = 60,
  maxAlternatives: number = 5
): Promise<AlternativeSlot[]> => {
  try {
    // Get all providers for this service
    const { data: providers, error } = await supabase
      .from('services')
      .select(`
        provider_id,
        profiles!provider_id(id, full_name, business_name)
      `)
      .eq('id', serviceId)
      .eq('is_active', true);

    if (error) throw error;

    const alternatives: AlternativeSlot[] = [];
    const searchDates = [];
    
    // Search for alternatives in the next 7 days
    for (let i = 0; i < 7; i++) {
      const searchDate = format(addDays(parseISO(originalDate), i), 'yyyy-MM-dd');
      searchDates.push(searchDate);
    }
    
    for (const provider of providers || []) {
      if (alternatives.length >= maxAlternatives) break;
      
      for (const searchDate of searchDates) {
        if (alternatives.length >= maxAlternatives) break;
        
        const timeSlots = await getAvailableTimeSlots(
          provider.provider_id,
          searchDate,
          serviceDuration
        );
        
        const availableSlots = timeSlots.filter(slot => slot.available);
        
        for (const slot of availableSlots) {
          if (alternatives.length >= maxAlternatives) break;
          
          // Skip the original slot if it's the same provider and time
          if (searchDate === originalDate && slot.time === originalTime) {
            continue;
          }
          
          alternatives.push({
            date: searchDate,
            time: slot.time,
            provider_id: provider.provider_id,
            provider_name: provider.profiles?.business_name || provider.profiles?.full_name || 'Unknown Provider'
          });
        }
      }
    }
    
    return alternatives;
  } catch (error) {
    console.error('Error finding alternative slots:', error);
    return [];
  }
};

/**
 * Generate recurring booking dates based on the pattern
 */
export const generateRecurringDates = (
  startDate: string,
  endDate: string,
  recurringType: 'weekly' | 'biweekly' | 'monthly',
  recurringDays?: number[]
): string[] => {
  const dates: string[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (recurringType === 'monthly') {
    // For monthly, just add the same date each month
    let current = start;
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addMonths(current, 1);
    }
  } else if ((recurringType === 'weekly' || recurringType === 'biweekly') && recurringDays && recurringDays.length > 0) {
    // For weekly/biweekly with specific days
    let current = start;
    const weekIncrement = recurringType === 'weekly' ? 1 : 2;
    
    while (current <= end) {
      // Check each day of the current week
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = addDays(current, dayOffset);
        if (checkDate > end) break;
        
        if (recurringDays.includes(checkDate.getDay()) && checkDate >= start) {
          dates.push(format(checkDate, 'yyyy-MM-dd'));
        }
      }
      current = addWeeks(current, weekIncrement);
    }
  } else {
    // Default: just use the start date and repeat based on type
    let current = start;
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      
      switch (recurringType) {
        case 'weekly':
          current = addWeeks(current, 1);
          break;
        case 'biweekly':
          current = addWeeks(current, 2);
          break;
        case 'monthly':
          current = addMonths(current, 1);
          break;
      }
    }
  }
  
  return dates.sort();
};

/**
 * Create multiple bookings for recurring services
 */
export const createRecurringBookings = async (
  bookingData: any,
  recurringDates: string[]
): Promise<{ success: boolean; bookingIds: string[]; errors: string[] }> => {
  const bookingIds: string[] = [];
  const errors: string[] = [];
  
  for (const date of recurringDates) {
    try {
      // Check for conflicts before creating each booking
      const { hasConflict } = await checkBookingConflicts(
        bookingData.provider_id,
        date,
        bookingData.booking_time,
        bookingData.duration_minutes
      );
      
      if (hasConflict) {
        errors.push(`Conflict found for ${date} at ${bookingData.booking_time}`);
        continue;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          booking_date: date
        })
        .select('id')
        .single();
      
      if (error) {
        errors.push(`Failed to create booking for ${date}: ${error.message}`);
      } else if (data) {
        bookingIds.push(data.id);
      }
    } catch (error) {
      errors.push(`Error creating booking for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return {
    success: bookingIds.length > 0,
    bookingIds,
    errors
  };
};

// Helper functions
const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};