import React, { useState, useEffect } from "react";
import { Star, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useHasUserReviewed } from "@/hooks/useReviews";
import { getReviewPromptTiming } from "@/lib/ratingUtils";
import ReviewForm from "./ReviewForm";

interface ReviewPromptProps {
  booking: {
    id: string;
    service_id: string;
    provider_id: string;
    status: string;
    updated_at: string;
    service: {
      name: string;
    };
    provider: {
      full_name: string | null;
      business_name: string | null;
    };
  };
  onDismiss?: () => void;
  autoShow?: boolean;
}

const ReviewPrompt = ({ booking, onDismiss, autoShow = true }: ReviewPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { profile } = useAuth();
  const { hasReviewed, loading } = useHasUserReviewed(booking.id, profile?.id);

  useEffect(() => {
    if (loading || hasReviewed || dismissed || booking.status !== 'completed') {
      return;
    }

    if (autoShow) {
      const completedAt = new Date(booking.updated_at);
      const hoursToWait = getReviewPromptTiming(completedAt);
      
      if (hoursToWait === 0) {
        setShowPrompt(true);
      } else {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, hoursToWait * 60 * 60 * 1000);
        
        return () => clearTimeout(timer);
      }
    } else {
      setShowPrompt(true);
    }
  }, [loading, hasReviewed, dismissed, booking.status, booking.updated_at, autoShow]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    onDismiss?.();
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setShowPrompt(false);
  };

  if (loading || hasReviewed || !showPrompt) {
    return null;
  }

  const providerName = booking.provider.business_name || booking.provider.full_name || 'Provider';

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                How was your experience?
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                Your service "{booking.service.name}" with {providerName} has been completed. 
                Help other customers by sharing your experience!
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Clock className="w-3 h-3" />
                <span>Completed {new Date(booking.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Write Review
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDismiss}
                >
                  Maybe Later
                </Button>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close review prompt"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReviewForm && (
        <ReviewForm
          bookingId={booking.id}
          serviceId={booking.service_id}
          providerId={booking.provider_id}
          serviceName={booking.service.name}
          onClose={() => setShowReviewForm(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
};

export default ReviewPrompt;