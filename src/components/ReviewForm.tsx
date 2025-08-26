import React, { useState } from "react";
import { Star, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubmitReview } from "@/hooks/useReviews";
import { moderateContent, shouldAutoApprove } from "@/lib/contentModeration";

interface ReviewFormProps {
  bookingId: string;
  serviceId: string;
  providerId: string;
  serviceName: string;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ 
  bookingId, 
  serviceId, 
  providerId, 
  serviceName, 
  onClose, 
  onReviewSubmitted 
}: ReviewFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [moderationWarning, setModerationWarning] = useState<string[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();
  const { submitReview, submitting } = useSubmitReview();

  const handleCommentChange = (value: string) => {
    setComment(value);
    
    // Real-time content moderation
    if (value.trim()) {
      const moderation = moderateContent(value);
      setModerationWarning(moderation.flags);
    } else {
      setModerationWarning([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast({ title: "Error", description: "You must be logged in to submit a review" });
      return;
    }

    if (rating === 0) {
      toast({ title: "Error", description: "Please select a rating" });
      return;
    }

    // Check content moderation
    const isAutoApproved = shouldAutoApprove(comment);
    
    const result = await submitReview({
      bookingId,
      customerId: profile.id,
      providerId,
      serviceId,
      rating,
      comment,
    });

    if (result.success) {
      toast({ 
        title: "Review submitted!", 
        description: isAutoApproved 
          ? "Thank you for your feedback" 
          : "Your review is being reviewed and will be published soon"
      });
      
      onReviewSubmitted();
      onClose();
    } else {
      toast({ 
        title: "Error", 
        description: "Failed to submit review. Please try again." 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Rate Your Experience</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close review form">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Service: {serviceName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Comment (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="Share your experience with this service..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 characters
            </p>
            
            {/* Content Moderation Warning */}
            {moderationWarning.length > 0 && (
              <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="text-sm font-medium mb-1">Content Review Notice:</div>
                  <ul className="text-xs space-y-1">
                    {moderationWarning.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2">
                    Your review may require manual approval before being published.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={rating === 0 || submitting}
              className="flex-1"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;