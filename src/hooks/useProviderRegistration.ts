import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  providerRegistrationSchema, 
  type ProviderRegistrationFormData 
} from "@/lib/validations/profile";
import { uploadMultipleDocuments } from "@/lib/documentUtils";

export interface ProviderRegistrationState {
  loading: boolean;
  step: number;
  formData: Partial<ProviderRegistrationFormData>;
  documents: File[];
  errors: Record<string, string>;
}

export const useProviderRegistration = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<ProviderRegistrationState>({
    loading: false,
    step: 1,
    formData: {},
    documents: [],
    errors: {}
  });

  const updateFormData = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: '' } // Clear error when field is updated
    }));
  };

  const setDocuments = (files: File[]) => {
    setState(prev => ({ ...prev, documents: files }));
  };

  const setStep = (step: number) => {
    setState(prev => ({ ...prev, step }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Business Information
        if (!state.formData.business_name?.trim()) {
          errors.business_name = "Business name is required";
        }
        if (!state.formData.business_description?.trim()) {
          errors.business_description = "Business description is required";
        }
        if (!state.formData.experience_years || state.formData.experience_years < 0) {
          errors.experience_years = "Experience years is required";
        }
        break;
        
      case 2: // Contact & Location
        if (!state.formData.phone?.trim()) {
          errors.phone = "Phone number is required";
        }
        if (!state.formData.address?.trim()) {
          errors.address = "Address is required";
        }
        if (!state.formData.city?.trim()) {
          errors.city = "City is required";
        }
        if (!state.formData.state?.trim()) {
          errors.state = "State is required";
        }
        if (!state.formData.pincode?.trim()) {
          errors.pincode = "Pincode is required";
        }
        break;
        
      case 3: // Skills & Services
        if (!state.formData.skills?.length) {
          errors.skills = "At least one skill is required";
        }
        if (!state.formData.service_areas?.length) {
          errors.service_areas = "At least one service area is required";
        }
        break;
        
      case 4: // Documents
        if (state.documents.length === 0) {
          errors.documents = "At least one document is required";
        }
        break;
    }
    
    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(state.step)) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const submitRegistration = async (): Promise<boolean> => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Validate complete form data
      const validationResult = providerRegistrationSchema.safeParse(state.formData);
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.errors.forEach(error => {
          if (error.path.length > 0) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setState(prev => ({ ...prev, errors }));
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
        return false;
      }

      // Upload documents
      const documentUploadResult = await uploadMultipleDocuments(
        state.documents,
        profile.id
      );

      if (!documentUploadResult.success) {
        toast({
          title: "Document Upload Failed",
          description: documentUploadResult.errors.join(', '),
          variant: "destructive",
        });
        return false;
      }

      // Update profile with provider information
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'provider',
          business_name: state.formData.business_name,
          business_license: state.formData.business_license,
          tax_id: state.formData.tax_id,
          experience_years: state.formData.experience_years,
          skills: state.formData.skills,
          verification_documents: documentUploadResult.filePaths,
          verification_status: 'pending',
          full_name: state.formData.full_name,
          phone: state.formData.phone,
          address: state.formData.address,
          city: state.formData.city,
          state: state.formData.state,
          pincode: state.formData.pincode,
          // Additional provider fields
          business_description: state.formData.business_description,
          service_areas: state.formData.service_areas,
          certifications: state.formData.certifications,
          insurance_number: state.formData.insurance_number,
          website_url: state.formData.website_url,
          social_media_links: state.formData.social_media_links,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: "Registration Submitted",
        description: "Your provider application has been submitted for review. You'll be notified once it's approved.",
      });

      return true;
    } catch (error: any) {
      console.error('Provider registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration",
        variant: "destructive",
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetForm = () => {
    setState({
      loading: false,
      step: 1,
      formData: {},
      documents: [],
      errors: {}
    });
  };

  return {
    state,
    updateFormData,
    setDocuments,
    setStep,
    nextStep,
    prevStep,
    validateStep,
    submitRegistration,
    resetForm
  };
};