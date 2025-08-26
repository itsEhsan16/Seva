import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  service_areas: string[] | null;
  category_id: string;
  provider_id: string;
  created_at: string;
  updated_at: string;
  provider?: {
    full_name: string | null;
    avatar_url: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    business_name?: string | null;
    experience_years?: number | null;
    skills?: string[] | null;
    verification_status?: string | null;
    is_verified?: boolean;
  };
  reviews?: {
    rating: number;
  }[];
}

export const useServiceCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

import { 
  LocationFilter, 
  matchesServiceArea, 
  getDistanceAndTime, 
  getCoordinatesFromProfile,
  DEFAULT_SEARCH_RADIUS,
  getExpandedRadius,
  isValidCoordinates
} from '@/lib/locationUtils';

export interface ServiceWithDistance extends Service {
  distance?: number;
  travelTime?: number;
  providerCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const useServices = (categoryId?: string, locationFilter?: LocationFilter) => {
  const [services, setServices] = useState<ServiceWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(locationFilter?.radius || DEFAULT_SEARCH_RADIUS);
  const [expandedSearch, setExpandedSearch] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('services')
        .select(`
          *,
          provider:profiles!services_provider_id_fkey(
            full_name, 
            avatar_url, 
            address, 
            city, 
            state, 
            pincode,
            business_name,
            experience_years,
            skills,
            verification_status,
            is_verified
          ),
          reviews(rating)
        `)
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredServices = data || [];

      // Apply location-based filtering
      if (locationFilter) {
        filteredServices = await filterServicesByLocation(filteredServices, locationFilter);
      }

      // Sort by distance if coordinates are available
      if (locationFilter?.latitude && locationFilter?.longitude) {
        filteredServices.sort((a, b) => {
          const distanceA = a.distance || Infinity;
          const distanceB = b.distance || Infinity;
          return distanceA - distanceB;
        });
      }

      setServices(filteredServices);

      // If no services found and we haven't expanded search yet, try expanding radius
      if (filteredServices.length === 0 && !expandedSearch && locationFilter?.latitude && locationFilter?.longitude) {
        const newRadius = getExpandedRadius(searchRadius);
        if (newRadius > searchRadius) {
          setSearchRadius(newRadius);
          setExpandedSearch(true);
          // Retry with expanded radius
          const expandedFilter = { ...locationFilter, radius: newRadius };
          const expandedServices = await filterServicesByLocation(data || [], expandedFilter);
          setServices(expandedServices);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterServicesByLocation = async (
    services: Service[], 
    filter: LocationFilter
  ): Promise<ServiceWithDistance[]> => {
    const servicesWithDistance: ServiceWithDistance[] = [];

    for (const service of services) {
      let includeService = false;
      let distance: number | undefined;
      let travelTime: number | undefined;
      let providerCoordinates: { latitude: number; longitude: number } | undefined;

      // Check service areas match
      if (service.service_areas && (filter.city || filter.state || filter.pincode)) {
        includeService = matchesServiceArea(filter, service.service_areas);
      }

      // If we have coordinates, check distance-based filtering
      if (isValidCoordinates(filter.latitude, filter.longitude)) {
        // Get provider coordinates
        const provider = service.provider;
        if (provider) {
          const coords = await getCoordinatesFromProfile(
            provider.address,
            provider.city,
            provider.state,
            provider.pincode
          );

          if (coords) {
            providerCoordinates = coords;
            const distanceResult = getDistanceAndTime(
              filter.latitude!,
              filter.longitude!,
              coords.latitude,
              coords.longitude
            );

            distance = distanceResult.distance;
            travelTime = distanceResult.travelTime;

            // Check if within radius
            const radius = filter.radius || searchRadius;
            if (distance <= radius) {
              includeService = true;
            }
          }
        }

        // If no provider coordinates but service areas match location, include it
        if (!providerCoordinates && service.service_areas) {
          includeService = matchesServiceArea(filter, service.service_areas);
        }
      }

      // If no specific location filter, include all services
      if (!filter.city && !filter.state && !filter.pincode && !filter.latitude && !filter.longitude) {
        includeService = true;
      }

      if (includeService) {
        servicesWithDistance.push({
          ...service,
          distance,
          travelTime,
          providerCoordinates
        });
      }
    }

    return servicesWithDistance;
  };

  useEffect(() => {
    setExpandedSearch(false);
    setSearchRadius(locationFilter?.radius || DEFAULT_SEARCH_RADIUS);
    fetchServices();
  }, [categoryId, locationFilter]);

  return { 
    services, 
    loading, 
    error, 
    refetch: fetchServices,
    searchRadius,
    expandedSearch
  };
};