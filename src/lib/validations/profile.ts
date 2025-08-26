import { z } from "zod";

// Base profile schema for common fields
export const baseProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters"),
  phone: z.string().regex(/^[+]?[\d\s\-\(\)]{10,15}$/, "Please enter a valid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address must be less than 200 characters"),
  city: z.string().min(2, "City must be at least 2 characters").max(50, "City must be less than 50 characters"),
  state: z.string().min(2, "State must be at least 2 characters").max(50, "State must be less than 50 characters"),
  pincode: z.string().regex(/^[0-9]{5,6}$/, "Please enter a valid pincode"),
});

// Customer profile schema
export const customerProfileSchema = baseProfileSchema;

// Provider profile schema with additional fields
export const providerProfileSchema = baseProfileSchema.extend({
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(100, "Business name must be less than 100 characters"),
  business_license: z.string().min(5, "Business license must be at least 5 characters").max(50, "Business license must be less than 50 characters").optional(),
  tax_id: z.string().min(5, "Tax ID must be at least 5 characters").max(50, "Tax ID must be less than 50 characters").optional(),
  experience_years: z.number().min(0, "Experience years cannot be negative").max(50, "Experience years cannot exceed 50"),
  skills: z.array(z.string()).min(1, "Please select at least one skill").max(10, "Maximum 10 skills allowed"),
});

// Provider registration schema with document validation
export const providerRegistrationSchema = providerProfileSchema.extend({
  business_description: z.string().min(50, "Business description must be at least 50 characters").max(500, "Business description must be less than 500 characters"),
  service_areas: z.array(z.string()).min(1, "Please select at least one service area").max(5, "Maximum 5 service areas allowed"),
  certifications: z.array(z.string()).optional(),
  insurance_number: z.string().min(5, "Insurance number must be at least 5 characters").max(50, "Insurance number must be less than 50 characters").optional(),
  website_url: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  social_media_links: z.object({
    facebook: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
    instagram: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
    linkedin: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  }).optional(),
});

// Document validation schema
export const documentValidationSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
    type: z.string().refine(
      (type) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(type),
      "Only PDF, JPG, and PNG files are allowed"
    ),
  })).min(1, "At least one document is required").max(5, "Maximum 5 documents allowed"),
});

// Profile update schema (all fields optional for partial updates)
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters").optional(),
  phone: z.string().regex(/^[+]?[\d\s\-\(\)]{10,15}$/, "Please enter a valid phone number").optional(),
  address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address must be less than 200 characters").optional(),
  city: z.string().min(2, "City must be at least 2 characters").max(50, "City must be less than 50 characters").optional(),
  state: z.string().min(2, "State must be at least 2 characters").max(50, "State must be less than 50 characters").optional(),
  pincode: z.string().regex(/^[0-9]{5,6}$/, "Please enter a valid pincode").optional(),
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(100, "Business name must be less than 100 characters").optional(),
  business_license: z.string().min(5, "Business license must be at least 5 characters").max(50, "Business license must be less than 50 characters").optional(),
  tax_id: z.string().min(5, "Tax ID must be at least 5 characters").max(50, "Tax ID must be less than 50 characters").optional(),
  experience_years: z.number().min(0, "Experience years cannot be negative").max(50, "Experience years cannot exceed 50").optional(),
  skills: z.array(z.string()).min(1, "Please select at least one skill").max(10, "Maximum 10 skills allowed").optional(),
});

export type CustomerProfileFormData = z.infer<typeof customerProfileSchema>;
export type ProviderProfileFormData = z.infer<typeof providerProfileSchema>;
export type ProviderRegistrationFormData = z.infer<typeof providerRegistrationSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type DocumentValidationData = z.infer<typeof documentValidationSchema>;

// Helper function to get required fields based on role
export const getRequiredFields = (role: string): string[] => {
  const baseRequired = ['full_name', 'phone', 'address', 'city', 'state', 'pincode'];
  
  if (role === 'provider') {
    return [...baseRequired, 'business_name'];
  }
  
  return baseRequired;
};

// Helper function to calculate profile completion percentage
export const calculateProfileCompletion = (profile: any, role: string): number => {
  const requiredFields = getRequiredFields(role);
  const completedFields = requiredFields.filter(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });
  
  return Math.round((completedFields.length / requiredFields.length) * 100);
};