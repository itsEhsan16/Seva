import { describe, it, expect } from 'vitest';
import { 
  calculateRatingStats, 
  getRatingColor, 
  getRatingBadge, 
  shouldShowRating, 
  formatRatingDisplay,
  getReviewPromptTiming,
  shouldSendReviewReminder
} from '@/lib/ratingUtils';

describe('ratingUtils', () => {
  describe('calculateRatingStats', () => {
    it('should return zero stats for empty ratings array', () => {
      const result = calculateRatingStats([]);
      
      expect(result).toEqual({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0],
        weightedScore: 0
      });
    });

    it('should calculate correct stats for ratings', () => {
      const ratings = [5, 4, 5, 3, 4, 5, 2];
      const result = calculateRatingStats(ratings);
      
      expect(result.averageRating).toBe(4.0);
      expect(result.totalReviews).toBe(7);
      expect(result.ratingDistribution).toEqual([0, 1, 1, 2, 3]);
      expect(result.weightedScore).toBeGreaterThan(0);
    });

    it('should handle single rating', () => {
      const result = calculateRatingStats([5]);
      
      expect(result.averageRating).toBe(5.0);
      expect(result.totalReviews).toBe(1);
      expect(result.ratingDistribution).toEqual([0, 0, 0, 0, 1]);
    });

    it('should calculate weighted score correctly for few reviews', () => {
      const result = calculateRatingStats([5, 5]); // Only 2 reviews
      
      // Should be weighted towards global average (4.0)
      expect(result.weightedScore).toBeLessThan(result.averageRating);
      expect(result.weightedScore).toBeGreaterThan(4.0);
    });

    it('should ignore invalid ratings', () => {
      const result = calculateRatingStats([5, 4, 0, 6, 3]); // 0 and 6 are invalid
      
      expect(result.totalReviews).toBe(5);
      expect(result.ratingDistribution).toEqual([0, 0, 1, 1, 1]); // Only valid ratings counted in distribution
    });
  });

  describe('getRatingColor', () => {
    it('should return correct colors for different rating ranges', () => {
      expect(getRatingColor(4.8)).toBe('text-green-600');
      expect(getRatingColor(4.2)).toBe('text-blue-600');
      expect(getRatingColor(3.7)).toBe('text-yellow-600');
      expect(getRatingColor(3.2)).toBe('text-orange-600');
      expect(getRatingColor(2.5)).toBe('text-red-600');
    });
  });

  describe('getRatingBadge', () => {
    it('should return correct badges for different scenarios', () => {
      expect(getRatingBadge(0, 0)).toBe('New Provider');
      expect(getRatingBadge(4.9, 25)).toBe('Top Rated');
      expect(getRatingBadge(4.6, 15)).toBe('Highly Rated');
      expect(getRatingBadge(4.2, 5)).toBe('Good Rating');
      expect(getRatingBadge(3.7, 10)).toBe('Average Rating');
      expect(getRatingBadge(2.8, 5)).toBe('Needs Improvement');
    });
  });

  describe('shouldShowRating', () => {
    it('should show rating only when reviews exist', () => {
      expect(shouldShowRating(0)).toBe(false);
      expect(shouldShowRating(1)).toBe(true);
      expect(shouldShowRating(10)).toBe(true);
    });
  });

  describe('formatRatingDisplay', () => {
    it('should format rating display correctly', () => {
      expect(formatRatingDisplay(0, 0)).toBe('No reviews yet');
      expect(formatRatingDisplay(4.5, 1)).toBe('4.5 (1 review)');
      expect(formatRatingDisplay(4.2, 5)).toBe('4.2 (5 reviews)');
    });
  });

  describe('getReviewPromptTiming', () => {
    it('should return 0 for bookings completed more than 2 hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(getReviewPromptTiming(threeHoursAgo)).toBe(0);
    });

    it('should return hours to wait for recent bookings', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const result = getReviewPromptTiming(oneHourAgo);
      expect(result).toBe(1);
    });

    it('should return 2 for just completed bookings', () => {
      const justNow = new Date();
      const result = getReviewPromptTiming(justNow);
      expect(result).toBe(2);
    });
  });

  describe('shouldSendReviewReminder', () => {
    it('should not send reminder for bookings older than 7 days', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      expect(shouldSendReviewReminder(eightDaysAgo)).toBe(false);
    });

    it('should send first reminder after 1 day', () => {
      const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      expect(shouldSendReviewReminder(oneDayAgo)).toBe(true);
    });

    it('should not send reminder for recent bookings', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(shouldSendReviewReminder(twoHoursAgo)).toBe(false);
    });

    it('should send second reminder after 3 days if first was sent', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      
      expect(shouldSendReviewReminder(fourDaysAgo, twoDaysAgo)).toBe(true);
    });

    it('should not send second reminder too soon after first', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      
      expect(shouldSendReviewReminder(threeDaysAgo, oneHourAgo)).toBe(false);
    });
  });
});