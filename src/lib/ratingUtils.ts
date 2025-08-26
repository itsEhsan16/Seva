// Utility functions for rating calculations and management

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: [number, number, number, number, number];
  weightedScore: number;
}

export const calculateRatingStats = (ratings: number[]): RatingStats => {
  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: [0, 0, 0, 0, 0],
      weightedScore: 0
    };
  }

  const totalReviews = ratings.length;
  const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
  const averageRating = totalRating / totalReviews;

  // Calculate distribution
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1]++;
    }
  });

  // Calculate weighted score (Bayesian average)
  // This helps new providers with few reviews not get penalized too heavily
  const globalAverage = 4.0; // Assume platform average is 4.0
  const minimumReviews = 5; // Minimum reviews for full weight
  const weight = Math.min(totalReviews / minimumReviews, 1);
  const weightedScore = (weight * averageRating) + ((1 - weight) * globalAverage);

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution: distribution,
    weightedScore: Math.round(weightedScore * 10) / 10
  };
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-blue-600';
  if (rating >= 3.5) return 'text-yellow-600';
  if (rating >= 3.0) return 'text-orange-600';
  return 'text-red-600';
};

export const getRatingBadge = (rating: number, totalReviews: number): string => {
  if (totalReviews === 0) return 'New Provider';
  if (rating >= 4.8 && totalReviews >= 20) return 'Top Rated';
  if (rating >= 4.5 && totalReviews >= 10) return 'Highly Rated';
  if (rating >= 4.0) return 'Good Rating';
  if (rating >= 3.5) return 'Average Rating';
  return 'Needs Improvement';
};

export const shouldShowRating = (totalReviews: number): boolean => {
  return totalReviews > 0;
};

export const formatRatingDisplay = (rating: number, totalReviews: number): string => {
  if (totalReviews === 0) return 'No reviews yet';
  if (totalReviews === 1) return `${rating} (1 review)`;
  return `${rating} (${totalReviews} reviews)`;
};

export const getReviewPromptTiming = (bookingCompletedAt: Date): number => {
  // Return hours to wait before prompting for review
  const now = new Date();
  const hoursElapsed = (now.getTime() - bookingCompletedAt.getTime()) / (1000 * 60 * 60);
  
  // Prompt immediately if service was completed more than 2 hours ago
  if (hoursElapsed >= 2) return 0;
  
  // Otherwise wait until 2 hours have passed
  return Math.ceil(2 - hoursElapsed);
};

export const shouldSendReviewReminder = (bookingCompletedAt: Date, lastReminderSent?: Date): boolean => {
  const now = new Date();
  const daysSinceCompletion = (now.getTime() - bookingCompletedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Don't send reminders after 7 days
  if (daysSinceCompletion > 7) return false;
  
  // Send first reminder after 1 day
  if (daysSinceCompletion >= 1 && !lastReminderSent) return true;
  
  // Send second reminder after 3 days (if first reminder was sent)
  if (lastReminderSent) {
    const daysSinceLastReminder = (now.getTime() - lastReminderSent.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCompletion >= 3 && daysSinceLastReminder >= 2;
  }
  
  return false;
};