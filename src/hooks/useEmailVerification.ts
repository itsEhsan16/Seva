import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useEmailVerification = (requireVerification: boolean = false) => {
  const { user, isEmailVerified, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If user is logged in but email is not verified
    if (user && !isEmailVerified) {
      if (requireVerification) {
        // For pages that require verification, redirect to auth
        toast({
          title: "Email verification required",
          description: "Please verify your email address to access this feature.",
          variant: "destructive",
        });
        navigate('/auth');
      } else {
        // For other pages, show a warning toast
        toast({
          title: "Email not verified",
          description: "Please check your email and verify your account for full access.",
          variant: "destructive",
        });
      }
    }
  }, [user, isEmailVerified, loading, requireVerification, toast, navigate]);

  return {
    user,
    isEmailVerified,
    loading,
    needsVerification: user && !isEmailVerified,
  };
};