import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  checkBookingConflicts,
  getAvailableTimeSlots,
  findAlternativeSlots,
  generateRecurringDates,
  createRecurringBookings,
  type TimeSlot,
  type AlternativeSlot
} from "@/lib/bookingUtils";
import { BookingFormData } from "@/lib/validations/booking";

export interface BookingState {
  loading: boolean;
  submitting: boolean;
  availableSlots: TimeSlot[];
  alternatives: AlternativeSlot[];
  conflicts: any[];
}

export const useBooking = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<BookingState>({
    loading: false,
    submitting: false,
    availableSlots: [],
    alternatives: [],
    conflicts: []
  });

  /**
   * Check real-time availability for a specific slot
   */
  const checkAvailability = useCallback(async (
    providerId: string,
    date: string,
    time: string,
    duration: number = 60
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { hasConflict, conflicts } = await checkBookingConflicts(
        providerId,
        date,
        time,
        duration
      );
      
      setState(prev => ({ 
        ...prev, 
        conflicts,
        loading: false 
      }));
      
      return { available: !hasConflict, conflicts };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Failed to check availability. Please try again.",
        variant: "destructive"
      });
      return { available: false, conflicts: [] };
    }
  }, [toast]);

  /**
   * Get available time slots for a provider on a specific date
   */
  const getTimeSlots = useCallback(async (
    providerId: string,
    date: string,
    serviceDuration: number = 60
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const slots = await getAvailableTimeSlots(providerId, date, serviceDuration);
      
      setState(prev => ({ 
        ...prev, 
        availableSlots: slots,
        loading: false 
      }));
      
      return slots;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Failed to load available time slots.",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  /**
   * Find alternative booking slots
   */
  const getAlternatives = useCallback(async (
    serviceId: string,
    originalDate: string,
    originalTime: string,
    serviceDuration: number = 60
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const alternatives = await findAlternativeSlots(
        serviceId,
        originalDate,
        originalTime,
        serviceDuration
      );
      
      setState(prev => ({ 
        ...prev, 
        alternatives,
        loading: false 
      }));
      
      return alternatives;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Failed to find alternative slots.",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  /**
   * Create a single booking
   */
  const createBooking = useCallback(async (bookingData: BookingFormData) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a booking.",
        variant: "destructive"
      });
      return { success: false, bookingId: null };
    }

    setState(prev => ({ ...prev, submitting: true }));

    try {
      // First check for conflicts
      const { available } = await checkAvailability(
        bookingData.providerId,
        bookingData.bookingDate,
        bookingData.bookingTime
      );

      if (!available) {
        toast({
          title: "Booking Conflict",
          description: "This time slot is no longer available. Please choose another time.",
          variant: "destructive"
        });
        setState(prev => ({ ...prev, submitting: false }));
        return { success: false, bookingId: null };
      }

      // Get service details for pricing
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('price, duration_minutes')
        .eq('id', bookingData.serviceId)
        .single();

      if (serviceError) throw serviceError;

      // Create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_id: profile.id,
          provider_id: bookingData.providerId,
          service_id: bookingData.serviceId,
          booking_date: bookingData.bookingDate,
          booking_time: bookingData.bookingTime,
          customer_address: bookingData.customerAddress,
          customer_notes: bookingData.customerNotes || null,
          total_amount: service.price,
          status: 'pending',
          payment_status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      setState(prev => ({ ...prev, submitting: false }));
      
      toast({
        title: "Booking Created",
        description: "Your booking has been created successfully!",
      });

      return { success: true, bookingId: data.id };
    } catch (error) {
      setState(prev => ({ ...prev, submitting: false }));
      
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking.",
        variant: "destructive"
      });
      
      return { success: false, bookingId: null };
    }
  }, [profile?.id, toast, checkAvailability]);

  /**
   * Create recurring bookings
   */
  const createRecurringBooking = useCallback(async (bookingData: BookingFormData) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create bookings.",
        variant: "destructive"
      });
      return { success: false, bookingIds: [], errors: [] };
    }

    if (!bookingData.isRecurring || !bookingData.recurringType || !bookingData.recurringEndDate) {
      return createBooking(bookingData);
    }

    setState(prev => ({ ...prev, submitting: true }));

    try {
      // Generate recurring dates
      const recurringDates = generateRecurringDates(
        bookingData.bookingDate,
        bookingData.recurringEndDate,
        bookingData.recurringType,
        bookingData.recurringDays
      );

      if (recurringDates.length === 0) {
        throw new Error("No valid dates found for recurring booking");
      }

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('price, duration_minutes')
        .eq('id', bookingData.serviceId)
        .single();

      if (serviceError) throw serviceError;

      // Create recurring bookings
      const result = await createRecurringBookings(
        {
          customer_id: profile.id,
          provider_id: bookingData.providerId,
          service_id: bookingData.serviceId,
          booking_time: bookingData.bookingTime,
          customer_address: bookingData.customerAddress,
          customer_notes: bookingData.customerNotes || null,
          total_amount: service.price,
          status: 'pending',
          payment_status: 'pending',
          duration_minutes: service.duration_minutes
        },
        recurringDates
      );

      setState(prev => ({ ...prev, submitting: false }));

      if (result.success) {
        toast({
          title: "Recurring Bookings Created",
          description: `Successfully created ${result.bookingIds.length} bookings.`,
        });
        
        if (result.errors.length > 0) {
          toast({
            title: "Some Bookings Failed",
            description: `${result.errors.length} bookings could not be created due to conflicts.`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Booking Failed",
          description: "Failed to create recurring bookings.",
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, submitting: false }));
      
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create recurring bookings.",
        variant: "destructive"
      });
      
      return { success: false, bookingIds: [], errors: [error instanceof Error ? error.message : "Unknown error"] };
    }
  }, [profile?.id, toast, createBooking]);

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    setState(prev => ({ ...prev, submitting: true }));

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          provider_notes: reason || 'Cancelled by customer'
        })
        .eq('id', bookingId)
        .eq('customer_id', profile?.id);

      if (error) throw error;

      setState(prev => ({ ...prev, submitting: false }));
      
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });

      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, submitting: false }));
      
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel booking.",
        variant: "destructive"
      });
      
      return { success: false };
    }
  }, [profile?.id, toast]);

  return {
    ...state,
    checkAvailability,
    getTimeSlots,
    getAlternatives,
    createBooking,
    createRecurringBooking,
    cancelBooking
  };
};