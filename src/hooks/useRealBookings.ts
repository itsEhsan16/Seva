import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RealBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  customer_address: string;
  customer_notes: string;
  provider_notes: string;
  created_at: string;
  updated_at: string;
  service_id: string;
  provider_id: string;
  customer_id: string;
}

interface BookingWithDetails extends RealBooking {
  service: {
    name: string;
    description: string;
    image_url: string;
  };
  provider: {
    full_name: string;
    phone: string;
    business_name: string;
  };
}

export const useRealBookings = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description, image_url),
          provider:profiles!provider_id(full_name, phone, business_name)
        `)
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: {
    service_id: string;
    provider_id: string;
    booking_date: string;
    booking_time: string;
    total_amount: number;
    customer_address: string;
    customer_notes?: string;
  }) => {
    if (!profile?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          customer_id: profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh bookings after creation
      await fetchBookings();
      
      return data;
    } catch (err) {
      console.error('Error creating booking:', err);
      throw err;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes) {
        updateData.provider_notes = notes;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
      
      // Refresh bookings after update
      await fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for booking updates
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${profile?.id}`
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    refetch: fetchBookings
  };
};