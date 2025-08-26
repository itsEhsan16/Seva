import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AvailabilitySlot {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export const useProviderAvailability = () => {
  const { profile } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', profile.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = async (availabilityData: Omit<AvailabilitySlot, 'id' | 'provider_id' | 'created_at'>) => {
    if (!profile?.id) return { error: 'No profile found' };

    try {
      const { data, error } = await supabase
        .from('provider_availability')
        .insert([{
          ...availabilityData,
          provider_id: profile.id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchAvailability(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to add availability' };
    }
  };

  const updateAvailability = async (availabilityId: string, availabilityData: Partial<AvailabilitySlot>) => {
    try {
      const { data, error } = await supabase
        .from('provider_availability')
        .update(availabilityData)
        .eq('id', availabilityId)
        .eq('provider_id', profile?.id)
        .select()
        .single();

      if (error) throw error;

      await fetchAvailability(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update availability' };
    }
  };

  const deleteAvailability = async (availabilityId: string) => {
    try {
      const { error } = await supabase
        .from('provider_availability')
        .delete()
        .eq('id', availabilityId)
        .eq('provider_id', profile?.id);

      if (error) throw error;

      await fetchAvailability(); // Refresh the list
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete availability' };
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [profile?.id]);

  return {
    availability,
    loading,
    error,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    refetch: fetchAvailability
  };
};