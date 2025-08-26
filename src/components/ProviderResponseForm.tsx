import React, { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProviderResponse } from "@/hooks/useReviews";

interface ProviderResponseFormProps {
  reviewId: string;
  customerName: string;
  customerRating: number;
  customerComment: string;
  existingResponse?: string;
  onClose: () => void;
  onResponseSubmitted: () => void;
}

const ProviderResponseForm = ({
  reviewId,
  customerName,
  customerRating,
  customerComment,
  existingResponse,
  onClose,
  onResponseSubmitted
}: ProviderResponseFormProps) => {
  const [response, setResponse] = useState(existingResponse || "");
  const { toast } = useToast();
  const { submitResponse, submitting } = useProviderResponse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast({ title: "Error", description: "Please enter a response" });
      return;
    }

    if (response.length > 500) {
      toast({ title: "Error", description: "Response must be 500 characters or less" });
      return;
    }

    const result = await submitResponse(reviewId, response);

    if (result.success) {
      toast({ 
        title: "Response submitted!", 
        description: "Your response has been added to the review" 
      });
      
      onResponseSubmitted();
      onClose();
    } else {
      toast({ 
        title: "Error", 
        description: "Failed to submit response. Please try again." 
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-muted-foreground"
            }`}
          >
            ★
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {existingResponse ? 'Edit Response' : 'Respond to Review'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close response form">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Customer Review Display */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{customerName}</span>
            {renderStars(customerRating)}
          </div>
          {customerComment && (
            <p className="text-sm text-muted-foreground italic">
              "{customerComment}"
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Your Response
            </label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Thank the customer and address their feedback professionally..."
              rows={6}
              maxLength={500}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                {response.length}/500 characters
              </p>
              <p className="text-xs text-muted-foreground">
                Tip: Keep responses professional and constructive
              </p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Response Guidelines:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Thank the customer for their feedback</li>
              <li>• Address specific concerns mentioned in the review</li>
              <li>• Keep the tone professional and courteous</li>
              <li>• Avoid defensive language or arguments</li>
              <li>• Offer solutions or improvements when appropriate</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!response.trim() || submitting}
              className="flex-1 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : existingResponse ? "Update Response" : "Submit Response"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderResponseForm;