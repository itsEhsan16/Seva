import { describe, it, expect } from 'vitest';
import { moderateContent, shouldAutoApprove, requiresManualReview } from '@/lib/contentModeration';

describe('contentModeration', () => {
  describe('moderateContent', () => {
    it('should approve clean content', () => {
      const result = moderateContent('Great service, very professional and on time!');
      
      expect(result.isAppropriate).toBe(true);
      expect(result.flags).toHaveLength(0);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should flag inappropriate language', () => {
      const result = moderateContent('This service was damn terrible and the guy was an idiot');
      
      expect(result.isAppropriate).toBe(false);
      expect(result.flags.length).toBeGreaterThan(0);
      expect(result.flags.some(flag => flag.includes('inappropriate language'))).toBe(true);
    });

    it('should flag spam patterns - phone numbers', () => {
      const result = moderateContent('Call me at 1234567890 for better service');
      
      expect(result.isAppropriate).toBe(false);
      expect(result.flags.some(flag => flag.includes('phone number'))).toBe(true);
    });

    it('should flag spam patterns - email addresses', () => {
      const result = moderateContent('Email me at test@example.com for discounts');
      
      expect(result.isAppropriate).toBe(false);
      expect(result.flags.some(flag => flag.includes('email address'))).toBe(true);
    });

    it('should flag spam patterns - URLs', () => {
      const result = moderateContent('Visit https://example.com for better deals');
      
      expect(result.flags.some(flag => flag.includes('URL'))).toBe(true);
      expect(result.isAppropriate).toBe(false);
    });

    it('should flag excessive capitalization', () => {
      const result = moderateContent('THIS SERVICE WAS ABSOLUTELY TERRIBLE!!!');
      
      expect(result.flags.some(flag => flag.includes('Excessive capitalization'))).toBe(true);
    });

    it('should flag repetitive characters', () => {
      const result = moderateContent('Noooooooo this was terrible!!!!!');
      
      expect(result.flags.some(flag => flag.includes('Repetitive characters'))).toBe(true);
    });

    it('should flag very short reviews', () => {
      const result = moderateContent('Bad');
      
      expect(result.flags.some(flag => flag.includes('too short'))).toBe(true);
    });

    it('should flag very long reviews', () => {
      const longReview = 'A'.repeat(1001);
      const result = moderateContent(longReview);
      
      expect(result.flags.some(flag => flag.includes('too long'))).toBe(true);
    });

    it('should handle empty content', () => {
      const result = moderateContent('');
      
      expect(result.isAppropriate).toBe(true);
      expect(result.flags).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should calculate confidence correctly', () => {
      const result = moderateContent('This damn service had some issues but overall okay');
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('shouldAutoApprove', () => {
    it('should auto-approve clean content', () => {
      expect(shouldAutoApprove('Excellent service, highly recommended!')).toBe(true);
    });

    it('should not auto-approve flagged content', () => {
      expect(shouldAutoApprove('This was damn terrible')).toBe(false);
    });

    it('should not auto-approve content with high confidence flags', () => {
      expect(shouldAutoApprove('Call me at 1234567890')).toBe(false);
    });
  });

  describe('requiresManualReview', () => {
    it('should require manual review for inappropriate content', () => {
      expect(requiresManualReview('This service was stupid')).toBe(true);
    });

    it('should require manual review for spam content', () => {
      expect(requiresManualReview('Email me at spam@example.com')).toBe(true);
    });

    it('should not require manual review for clean content', () => {
      expect(requiresManualReview('Great service, very professional')).toBe(false);
    });
  });
});