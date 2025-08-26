import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Service } from "./useServices";

export interface ProviderService extends Service {
  total_bookings?: number;
  total_earnings?: number;
  average_rating?: number;
}

export const useProviderServices = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_categories(name, icon),
          bookings(id, total_amount, status),
          reviews(rating, is_approved)
        `)
        .eq('provider_id', profile.id)
        .eq('is_active', true);

      if (error) throw error;

      const servicesWithStats = data?.map(service => ({
        ...service,
        category: service.service_categories,
        total_bookings: service.bookings?.length || 0,
        total_earnings: service.bookings?.reduce((sum: number, booking: any) => 
          booking.status === 'completed' ? sum + Number(booking.total_amount) : sum, 0) || 0,
        average_rating: service.reviews?.length 
          ? service.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / service.reviews.length 
          : 0
      })) || [];

      setServices(servicesWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const addService = async (serviceData: Partial<Service>) => {
    if (!profile?.id) return { error: 'No profile found' };

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: serviceData.name || '',
          price: serviceData.price || 0,
          description: serviceData.description,
          duration_minutes: serviceData.duration_minutes,
          category_id: serviceData.category_id,
          service_areas: serviceData.service_areas,
          image_url: serviceData.image_url,
          provider_id: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchServices(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to add service' };
    }
  };

  const updateService = async (serviceId: string, serviceData: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', serviceId)
        .eq('provider_id', profile?.id)
        .select()
        .single();

      if (error) throw error;

      await fetchServices(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update service' };
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('provider_id', profile?.id);

      if (error) throw error;

      await fetchServices(); // Refresh the list
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete service' };
    }
  };

  useEffect(() => {
    fetchServices();
  }, [profile?.id]);

  return {
    services,
    loading,
    error,
    addService,
    updateService,
    deleteService,
    refetch: fetchServices
  };
};