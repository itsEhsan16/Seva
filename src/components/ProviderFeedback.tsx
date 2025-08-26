import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, FileText } from "lucide-react";

interface ProviderFeedbackProps {
  onReapply: () => void;
}

export const ProviderFeedback: React.FC<ProviderFeedbackProps> = ({ onReapply }) => {
  const { profile } = useAuth();

  if (!profile || profile.role !== 'provider') {
    return null;
  }

  const getStatusContent = () => {
    switch (profile.verification_status) {
      case 'pending':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Application Under Review</h3>
              <p className="text-muted-foreground">
                Your provider application is currently being reviewed by our admin team. 
                You'll receive a notification once the review is complete.
              </p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Pending Review
            </Badge>
          </div>
        );

      case 'rejected':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Application Rejected</h3>
                <p className="text-muted-foreground">
                  Unfortunately, your provider application was not approved. 
                  Please review the feedback below and resubmit your application.
                </p>
              </div>
              <Badge variant="destructive">
                Rejected
              </Badge>
            </div>

            {profile.rejection_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2">Feedback from Admin</h4>
                <p className="text-red-600 text-sm">{profile.rejection_reason}</p>
              </div>
            )}

            <div className="text-center">
              <Button onClick={onReapply} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Resubmit Application
              </Button>
            </div>
          </div>
        );

      case 'approved':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Application Approved!</h3>
              <p className="text-muted-foreground">
                Congratulations! Your provider application has been approved. 
                You can now start offering services on our platform.
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Approved
            </Badge>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Provider Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          {getStatusContent()}
        </CardContent>
      </Card>
    </div>
  );
};