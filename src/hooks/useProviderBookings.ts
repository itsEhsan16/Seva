import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProviderBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  customer_notes?: string;
  provider_notes?: string;
  customer_address: string;
  created_at: string;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  customer: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
  };
}

export const useProviderBookings = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(id, name, duration_minutes),
          profiles!bookings_customer_id_fkey(id, full_name, phone, user_id)
        `)
        .eq('provider_id', profile.id)
        .order('booking_date', { ascending: true });

      if (error) throw error;

      // Get customer emails from auth metadata
      const bookingsWithCustomerData = await Promise.all(
        (data || []).map(async (booking) => {
          let customerEmail = '';
          if (booking.profiles?.user_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(booking.profiles.user_id);
            customerEmail = authUser.user?.email || '';
          }

          return {
            ...booking,
            service: booking.services,
            customer: {
              ...booking.profiles,
              email: customerEmail
            }
          };
        })
      );

      setBookings(bookingsWithCustomerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, providerNotes?: string) => {
    try {
      const updateData: any = { status };
      if (providerNotes) updateData.provider_notes = providerNotes;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('provider_id', profile?.id);

      if (error) throw error;

      await fetchBookings(); // Refresh the list
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update booking' };
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for new bookings
    const subscription = supabase
      .channel('provider-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${profile?.id}`
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id]);

  return {
    bookings,
    loading,
    error,
    updateBookingStatus,
    refetch: fetchBookings
  };
};