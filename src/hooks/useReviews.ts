import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: [number, number, number, number, number];
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  provider_response_date: string | null;
  is_approved: boolean;
  created_at: string;
  customer?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  service?: {
    name: string;
  };
  provider?: {
    full_name: string | null;
    business_name: string | null;
  };
}

export const useReviewStats = (serviceId?: string, providerId?: string) => {
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let query = supabase
          .from('reviews')
          .select('rating')
          .eq('is_approved', true);

        if (serviceId) {
          query = query.eq('service_id', serviceId);
        } else if (providerId) {
          query = query.eq('provider_id', providerId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const reviews = data || [];
        
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / reviews.length;
          
          const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
          reviews.forEach(review => {
            distribution[review.rating - 1]++;
          });

          setStats({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            ratingDistribution: distribution
          });
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [serviceId, providerId]);

  return { stats, loading };
};

export const useHasUserReviewed = (bookingId: string, customerId?: string) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkReview = async () => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('customer_id', customerId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setHasReviewed(!!data);
      } catch (error) {
        console.error('Error checking review status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkReview();
  }, [bookingId, customerId]);

  return { hasReviewed, loading, refetch: () => {
    setLoading(true);
    // Trigger re-check
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }};
};

export const useReviews = (serviceId?: string, providerId?: string, limit?: number) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [serviceId, providerId, limit]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          booking_id,
          customer_id,
          provider_id,
          service_id,
          rating,
          comment,
          provider_response,
          provider_response_date,
          is_approved,
          created_at,
          customer:profiles!customer_id(full_name, avatar_url),
          service:services(name),
          provider:profiles!provider_id(full_name, business_name)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      } else if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return { reviews, loading, refetch: fetchReviews };
};

export const useSubmitReview = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (reviewData: {
    bookingId: string;
    customerId: string;
    providerId: string;
    serviceId: string;
    rating: number;
    comment?: string;
  }) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: reviewData.bookingId,
          customer_id: reviewData.customerId,
          provider_id: reviewData.providerId,
          service_id: reviewData.serviceId,
          rating: reviewData.rating,
          comment: reviewData.comment?.trim() || null,
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error submitting review:', error);
      return { success: false, error };
    } finally {
      setSubmitting(false);
    }
  };

  return { submitReview, submitting };
};

export const useProviderResponse = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitResponse = async (reviewId: string, response: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          provider_response: response.trim(),
          provider_response_date: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error submitting provider response:', error);
      return { success: false, error };
    } finally {
      setSubmitting(false);
    }
  };

  return { submitResponse, submitting };
};

export const useReviewReminders = () => {
  const sendReminder = async (bookingId: string, customerId: string) => {
    try {
      // Check if reminder already sent recently (within 24 hours)
      const { data: existingReminder } = await supabase
        .from('review_reminders')
        .select('*')
        .eq('booking_id', bookingId)
        .gte('reminder_sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingReminder) {
        return { success: false, error: 'Reminder already sent recently' };
      }

      // Insert new reminder record
      const { error } = await supabase
        .from('review_reminders')
        .insert({
          booking_id: bookingId,
          customer_id: customerId,
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending review reminder:', error);
      return { success: false, error };
    }
  };

  return { sendReminder };
};