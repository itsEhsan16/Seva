import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/hooks/useLocation';
import { ProfileUpdateFormData, calculateProfileCompletion, getRequiredFields } from '@/lib/validations/profile';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address?: string;
}

export const useProfileManagement = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { calculateDistance } = useLocation();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Geocode address to get coordinates
  const geocodeAddress = useCallback(async (address: string, city: string, state: string, pincode: string): Promise<GeocodeResult | null> => {
    setGeocoding(true);
    try {
      const fullAddress = `${address}, ${city}, ${state} ${pincode}`;
      
      // Using OpenCage Geocoding API (demo key - replace with actual key in production)
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(fullAddress)}&key=demo&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formatted_address: result.formatted
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      // Don't throw error - geocoding is optional
      return null;
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Update profile with geocoding
  const updateProfile = useCallback(async (data: ProfileUpdateFormData): Promise<boolean> => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "No profile found. Please try logging in again.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      let updateData: any = { ...data };

      // If address fields are being updated, perform geocoding
      if (data.address && data.city && data.state && data.pincode) {
        const geocodeResult = await geocodeAddress(data.address, data.city, data.state, data.pincode);
        if (geocodeResult) {
          updateData.latitude = geocodeResult.latitude;
          updateData.longitude = geocodeResult.longitude;
        }
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      // Refresh profile data
      await refreshProfile();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile?.id, refreshProfile, toast, geocodeAddress]);

  // Check if profile is complete
  const isProfileComplete = useCallback((): boolean => {
    if (!profile) return false;
    
    const requiredFields = getRequiredFields(profile.role || 'customer');
    return requiredFields.every(field => {
      const value = profile[field as keyof typeof profile];
      return value !== null && value !== undefined && value !== '';
    });
  }, [profile]);

  // Get profile completion percentage
  const getProfileCompletion = useCallback((): number => {
    if (!profile) return 0;
    return calculateProfileCompletion(profile, profile.role || 'customer');
  }, [profile]);

  // Get missing required fields
  const getMissingFields = useCallback((): string[] => {
    if (!profile) return [];
    
    const requiredFields = getRequiredFields(profile.role || 'customer');
    return requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value === null || value === undefined || value === '';
    });
  }, [profile]);

  // Validate profile data
  const validateProfileData = useCallback((data: ProfileUpdateFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check required fields based on role
    const requiredFields = getRequiredFields(profile?.role || 'customer');
    
    requiredFields.forEach(field => {
      const value = data[field as keyof ProfileUpdateFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${field.replace('_', ' ')} is required`);
      }
    });

    // Additional validation
    if (data.phone && !/^[+]?[\d\s\-\(\)]{10,15}$/.test(data.phone)) {
      errors.push('Please enter a valid phone number');
    }

    if (data.pincode && !/^[0-9]{5,6}$/.test(data.pincode)) {
      errors.push('Please enter a valid pincode');
    }

    if (data.experience_years && (data.experience_years < 0 || data.experience_years > 50)) {
      errors.push('Experience years must be between 0 and 50');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [profile?.role]);

  return {
    profile,
    loading,
    geocoding,
    updateProfile,
    isProfileComplete: isProfileComplete(),
    profileCompletion: getProfileCompletion(),
    missingFields: getMissingFields(),
    validateProfileData,
    geocodeAddress,
  };
};