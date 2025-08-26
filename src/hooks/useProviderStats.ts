import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProviderStats {
  total_services: number;
  total_bookings: number;
  completed_bookings: number;
  total_earnings: number;
  average_rating: number;
  total_reviews: number;
  monthly_earnings: number;
  monthly_bookings: number;
}

export const useProviderStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ProviderStats>({
    total_services: 0,
    total_bookings: 0,
    completed_bookings: 0,
    total_earnings: 0,
    average_rating: 0,
    total_reviews: 0,
    monthly_earnings: 0,
    monthly_bookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Fetch overall stats from the provider_stats view
      const { data: statsData, error: statsError } = await supabase
        .from('provider_stats')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (statsError) throw statsError;

      // Calculate current month stats
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyBookings, error: monthlyError } = await supabase
        .from('bookings')
        .select('total_amount, status')
        .eq('provider_id', profile.id)
        .gte('booking_date', firstDayOfMonth.toISOString().split('T')[0]);

      if (monthlyError) throw monthlyError;

      const monthlyStats = monthlyBookings?.reduce(
        (acc, booking) => {
          acc.monthly_bookings++;
          if (booking.status === 'completed') {
            acc.monthly_earnings += Number(booking.total_amount);
          }
          return acc;
        },
        { monthly_bookings: 0, monthly_earnings: 0 }
      ) || { monthly_bookings: 0, monthly_earnings: 0 };

      setStats({
        ...statsData,
        ...monthlyStats
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile?.id]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};