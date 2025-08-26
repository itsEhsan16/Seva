import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the token from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'email') {
          setVerificationStatus('error');
          setErrorMessage('Invalid verification link. Please check your email and try again.');
          return;
        }

        // Verify the email using the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          console.error('Email verification error:', error);
          setVerificationStatus('error');
          
          if (error.message.includes('expired')) {
            setErrorMessage('This verification link has expired. Please request a new one.');
          } else if (error.message.includes('invalid')) {
            setErrorMessage('This verification link is invalid. Please check your email and try again.');
          } else {
            setErrorMessage(error.message || 'Failed to verify email. Please try again.');
          }
          return;
        }

        if (data.user) {
          setVerificationStatus('success');
          toast({
            title: "Email verified successfully!",
            description: "Your account is now active. You will be redirected shortly.",
          });

          // Redirect to home page after 3 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (error: any) {
        console.error('Unexpected error during email verification:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailVerification();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    try {
      // Get current user session to resend verification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        toast({
          title: "Error",
          description: "No user session found. Please sign in again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the new verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card w-full max-w-md p-8 text-center">
        {/* Logo */}
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-6">
          सेवा
        </div>

        {verificationStatus === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Verifying Your Email
            </h1>
            <p className="text-muted-foreground mb-6">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Email Verified Successfully!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your account is now active. You will be redirected to the home page shortly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Welcome to Seva! You can now book services and manage your account.
              </p>
            </div>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              Verification Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="button-primary w-full"
              >
                Send New Verification Email
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3 px-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;