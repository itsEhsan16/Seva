import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, Trash2, Star, User, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { moderateContent } from "@/lib/contentModeration";

interface ReviewForModeration {
  id: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  provider_response_date: string | null;
  created_at: string;
  is_approved: boolean;
  customer: {
    full_name: string | null;
  };
  service: {
    name: string;
  };
  provider: {
    full_name: string | null;
    business_name: string | null;
  };
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<ReviewForModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          provider_response,
          provider_response_date,
          created_at,
          is_approved,
          customer:profiles!customer_id(full_name),
          service:services(name),
          provider:profiles!provider_id(full_name, business_name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch reviews" 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: approved })
        .eq('id', reviewId);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `Review ${approved ? 'approved' : 'rejected'}` 
      });
      
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update review status" 
      });
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: "Review deleted" 
      });
      
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete review" 
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
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
      <div className="section-container py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-3xl font-bold mb-8">Review Moderation</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Approved' },
          { key: 'all', label: 'All Reviews' }
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            onClick={() => setFilter(tab.key as typeof filter)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No reviews found</h3>
          <p className="text-muted-foreground">
            {filter === 'pending' ? 'No reviews pending moderation' : 'No reviews in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="flex-1">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {review.customer.full_name || 'Anonymous Customer'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Review for {review.service.name} - {review.provider.business_name || review.provider.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={review.is_approved ? "secondary" : "destructive"}
                        className={review.is_approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    {renderStars(review.rating)}
                  </div>

                  {/* Comment with Moderation Analysis */}
                  {review.comment && (
                    <div className="mb-4">
                      <p className="text-sm leading-relaxed bg-muted p-3 rounded-lg">
                        "{review.comment}"
                      </p>
                      
                      {/* Content Moderation Analysis */}
                      {(() => {
                        const moderation = moderateContent(review.comment);
                        if (moderation.flags.length > 0) {
                          return (
                            <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-yellow-800">
                                <div className="text-sm font-medium mb-1">Content Flags:</div>
                                <ul className="text-xs space-y-1">
                                  {moderation.flags.map((flag, index) => (
                                    <li key={index}>• {flag}</li>
                                  ))}
                                </ul>
                                <p className="text-xs mt-2">
                                  Confidence: {Math.round(moderation.confidence * 100)}%
                                </p>
                              </AlertDescription>
                            </Alert>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Provider Response */}
                  {review.provider_response && (
                    <div className="mb-4 pl-4 border-l-2 border-primary/20 bg-primary/5 rounded-r-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Provider Response</span>
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!review.is_approved && (
                      <Button
                        size="sm"
                        onClick={() => updateReviewStatus(review.id, true)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                    )}
                    
                    {review.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewStatus(review.id, false)}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteReview(review.id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;