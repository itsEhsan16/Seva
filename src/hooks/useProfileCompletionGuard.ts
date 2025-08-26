import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionGuardOptions {
  redirectOnIncomplete?: boolean;
  showToast?: boolean;
  requiredFields?: string[];
}

export const useProfileCompletionGuard = (options: ProfileCompletionGuardOptions = {}) => {
  const { 
    redirectOnIncomplete = false, 
    showToast = true,
    requiredFields = []
  } = options;
  
  const { profile, user } = useAuth();
  const { isProfileComplete, missingFields, profileCompletion } = useProfileManagement();
  const { toast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);

  // Check if specific fields are complete
  const areRequiredFieldsComplete = (fields: string[]): boolean => {
    if (!profile || fields.length === 0) return true;
    
    return fields.every(field => {
      const value = profile[field as keyof typeof profile];
      return value !== null && value !== undefined && value !== '';
    });
  };

  // Get missing fields from the required list
  const getMissingRequiredFields = (fields: string[]): string[] => {
    if (!profile || fields.length === 0) return [];
    
    return fields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value === null || value === undefined || value === '';
    });
  };

  const specificFieldsComplete = areRequiredFieldsComplete(requiredFields);
  const specificMissingFields = getMissingRequiredFields(requiredFields);

  // Show toast notification for incomplete profile
  useEffect(() => {
    if (!user || !profile || hasShownToast) return;

    const shouldShowToast = showToast && (
      (requiredFields.length > 0 && !specificFieldsComplete) ||
      (requiredFields.length === 0 && !isProfileComplete)
    );

    if (shouldShowToast) {
      const missingFieldsList = requiredFields.length > 0 
        ? specificMissingFields 
        : missingFields;

      toast({
        title: "Complete Your Profile",
        description: `Please complete the following fields: ${missingFieldsList.join(', ')}`,
        variant: "default",
      });
      
      setHasShownToast(true);
    }
  }, [
    user, 
    profile, 
    isProfileComplete, 
    specificFieldsComplete, 
    missingFields, 
    specificMissingFields,
    requiredFields,
    showToast, 
    hasShownToast, 
    toast
  ]);

  // Reset toast flag when profile changes
  useEffect(() => {
    setHasShownToast(false);
  }, [profileCompletion]);

  return {
    isProfileComplete: requiredFields.length > 0 ? specificFieldsComplete : isProfileComplete,
    missingFields: requiredFields.length > 0 ? specificMissingFields : missingFields,
    profileCompletion,
    canAccessFeature: requiredFields.length > 0 ? specificFieldsComplete : isProfileComplete,
    profile,
  };
};