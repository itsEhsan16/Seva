import React, { useState } from "react";
import { Star, User, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useReviews } from "@/hooks/useReviews";
import { calculateRatingStats } from "@/lib/ratingUtils";
import ProviderResponseForm from "./ProviderResponseForm";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  provider_response_date: string | null;
  created_at: string;
  customer: {
    full_name: string | null;
    avatar_url: string | null;
  };
  provider?: {
    full_name: string | null;
    business_name: string | null;
  };
}

interface ReviewsListProps {
  serviceId?: string;
  providerId?: string;
  limit?: number;
}

const ReviewsList = ({ serviceId, providerId, limit }: ReviewsListProps) => {
  const [selectedReviewForResponse, setSelectedReviewForResponse] = useState<Review | null>(null);
  const { profile } = useAuth();
  const { reviews, loading, refetch } = useReviews(serviceId, providerId, limit);
  
  // Calculate stats from reviews
  const stats = calculateRatingStats(reviews.map(r => r.rating));

  const handleResponseSubmitted = () => {
    setSelectedReviewForResponse(null);
    refetch();
  };

  const canRespondToReview = (review: Review) => {
    // Check if current user is the provider for this review
    return profile?.id === review.provider_id;
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
        <p className="text-muted-foreground">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {stats.averageRating}
            </div>
            {renderStars(Math.round(stats.averageRating), 'md')}
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-3">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${stats.totalReviews > 0 
                        ? (stats.ratingDistribution[rating - 1] / stats.totalReviews) * 100 
                        : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm w-8 text-right">
                  {stats.ratingDistribution[rating - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="glass-card p-4">
            {/* Customer Review */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                {review.customer.avatar_url ? (
                  <img 
                    src={review.customer.avatar_url} 
                    alt={review.customer.full_name || "Customer"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {review.customer.full_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {canRespondToReview(review) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReviewForResponse(review)}
                      className="text-xs flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {review.provider_response ? 'Edit Response' : 'Respond'}
                    </Button>
                  )}
                </div>
                
                <div className="mb-2">
                  {renderStars(review.rating)}
                </div>
                
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {review.comment}
                  </p>
                )}

                {/* Provider Response */}
                {review.provider_response && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/20 bg-primary/5 rounded-r-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Response from {review.provider?.business_name || review.provider?.full_name || 'Provider'}
                      </span>
                      {review.provider_response_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.provider_response_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">
                      {review.provider_response}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Provider Response Form Modal */}
      {selectedReviewForResponse && (
        <ProviderResponseForm
          reviewId={selectedReviewForResponse.id}
          customerName={selectedReviewForResponse.customer.full_name || "Anonymous"}
          customerRating={selectedReviewForResponse.rating}
          customerComment={selectedReviewForResponse.comment || ""}
          existingResponse={selectedReviewForResponse.provider_response || undefined}
          onClose={() => setSelectedReviewForResponse(null)}
          onResponseSubmitted={handleResponseSubmitted}
        />
      )}
    </div>
  );
};

export default ReviewsList;