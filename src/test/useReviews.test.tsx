import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReviewStats, useReviews, useSubmitReview, useProviderResponse, useReviewReminders } from '@/hooks/useReviews';

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
      })),
      gte: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

describe('useReviews hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useReviewStats', () => {
    it('should return initial stats when no reviews exist', async () => {
      const { result } = renderHook(() => useReviewStats('service-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
      });
    });

    it('should calculate correct stats from review data', async () => {
      const mockReviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: mockReviews, error: null }))
        }))
      } as any);

      const { result } = renderHook(() => useReviewStats('service-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.averageRating).toBe(4.3);
      expect(result.current.stats.totalReviews).toBe(4);
      expect(result.current.stats.ratingDistribution).toEqual([0, 0, 1, 1, 2]);
    });
  });

  describe('useReviews', () => {
    it('should fetch reviews with provider responses', async () => {
      const mockReviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Great service',
          provider_response: 'Thank you!',
          provider_response_date: '2024-01-01',
          customer: { full_name: 'John Doe' }
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: mockReviews, error: null }))
            }))
          }))
        }))
      } as any);

      const { result } = renderHook(() => useReviews('service-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reviews).toEqual(mockReviews);
    });
  });

  describe('useSubmitReview', () => {
    it('should submit review successfully', async () => {
      const { result } = renderHook(() => useSubmitReview());

      const reviewData = {
        bookingId: 'booking-1',
        customerId: 'customer-1',
        providerId: 'provider-1',
        serviceId: 'service-1',
        rating: 5,
        comment: 'Excellent service'
      };

      const submitResult = await result.current.submitReview(reviewData);

      expect(submitResult.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reviews');
    });

    it('should handle submission errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ error: new Error('Database error') }))
      } as any);

      const { result } = renderHook(() => useSubmitReview());

      const reviewData = {
        bookingId: 'booking-1',
        customerId: 'customer-1',
        providerId: 'provider-1',
        serviceId: 'service-1',
        rating: 5
      };

      const submitResult = await result.current.submitReview(reviewData);

      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toBeDefined();
    });
  });

  describe('useProviderResponse', () => {
    it('should submit provider response successfully', async () => {
      const { result } = renderHook(() => useProviderResponse());

      const responseResult = await result.current.submitResponse('review-1', 'Thank you for your feedback!');

      expect(responseResult.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reviews');
    });
  });

  describe('useReviewReminders', () => {
    it('should send reminder successfully when no recent reminder exists', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ error: null }))
      } as any);

      const { result } = renderHook(() => useReviewReminders());

      const reminderResult = await result.current.sendReminder('booking-1', 'customer-1');

      expect(reminderResult.success).toBe(true);
    });

    it('should not send reminder if one was sent recently', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { id: '1', reminder_sent_at: new Date().toISOString() }, 
                error: null 
              }))
            }))
          }))
        }))
      } as any);

      const { result } = renderHook(() => useReviewReminders());

      const reminderResult = await result.current.sendReminder('booking-1', 'customer-1');

      expect(reminderResult.success).toBe(false);
      expect(reminderResult.error).toBe('Reminder already sent recently');
    });
  });
});