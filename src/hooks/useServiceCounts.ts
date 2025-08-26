import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceCounts {
  [categoryId: string]: number;
}

export const useServiceCounts = () => {
  const [counts, setCounts] = useState<ServiceCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('services')
          .select('category_id')
          .eq('is_active', true);

        if (error) throw error;

        // Count services by category
        const countMap: ServiceCounts = {};
        data?.forEach(service => {
          if (service.category_id) {
            countMap[service.category_id] = (countMap[service.category_id] || 0) + 1;
          }
        });

        setCounts(countMap);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceCounts();
  }, []);

  return { counts, loading, error };
};