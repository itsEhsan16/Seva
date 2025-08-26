import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useAdminGuard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the admin panel"
        });
        navigate('/auth');
        return;
      }

      if (profile?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel"
        });
        navigate('/');
        return;
      }

      setIsAuthorized(true);
    }
  }, [user, profile, loading, navigate, toast]);

  return {
    isAuthorized,
    isLoading: loading
  };
};