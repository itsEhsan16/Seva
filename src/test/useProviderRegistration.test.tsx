import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProviderRegistration } from '@/hooks/useProviderRegistration';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/documentUtils', () => ({
  uploadMultipleDocuments: vi.fn(),
  validateDocument: vi.fn(),
  formatFileSize: vi.fn(),
  getFileExtension: vi.fn(),
  isImageFile: vi.fn(),
  isPdfFile: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);
const mockSupabase = vi.mocked(supabase);

// Import mocked functions
import { uploadMultipleDocuments } from '@/lib/documentUtils';
const mockUploadMultipleDocuments = vi.mocked(uploadMultipleDocuments);

const mockProfile = {
  id: 'test-user-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  role: 'customer',
  verification_status: 'pending'
};

const mockToast = vi.fn();

describe('useProviderRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      refreshProfile: vi.fn(),
      user: null,
      loading: false,
      signOut: vi.fn()
    });

    mockUseToast.mockReturnValue({
      toast: mockToast
    });

    mockSupabase.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useProviderRegistration());

    expect(result.current.state).toEqual({
      loading: false,
      step: 1,
      formData: {},
      documents: [],
      errors: {}
    });
  });

  it('updates form data correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    act(() => {
      result.current.updateFormData('business_name', 'Test Business');
    });

    expect(result.current.state.formData.business_name).toBe('Test Business');
  });

  it('clears errors when updating form data', () => {
    const { result } = renderHook(() => useProviderRegistration());

    // Set an error first
    act(() => {
      result.current.state.errors.business_name = 'Required field';
    });

    // Update the field
    act(() => {
      result.current.updateFormData('business_name', 'Test Business');
    });

    expect(result.current.state.errors.business_name).toBe('');
  });

  it('validates step 1 correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    // Test validation with empty data
    let isValid;
    act(() => {
      isValid = result.current.validateStep(1);
    });

    expect(isValid).toBe(false);
    expect(result.current.state.errors.business_name).toBe('Business name is required');
    expect(result.current.state.errors.business_description).toBe('Business description is required');
    expect(result.current.state.errors.experience_years).toBe('Experience years is required');
  });

  it('validates step 2 correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    let isValid;
    act(() => {
      isValid = result.current.validateStep(2);
    });

    expect(isValid).toBe(false);
    expect(result.current.state.errors.phone).toBe('Phone number is required');
    expect(result.current.state.errors.address).toBe('Address is required');
    expect(result.current.state.errors.city).toBe('City is required');
    expect(result.current.state.errors.state).toBe('State is required');
    expect(result.current.state.errors.pincode).toBe('Pincode is required');
  });

  it('validates step 3 correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    let isValid;
    act(() => {
      isValid = result.current.validateStep(3);
    });

    expect(isValid).toBe(false);
    expect(result.current.state.errors.skills).toBe('At least one skill is required');
    expect(result.current.state.errors.service_areas).toBe('At least one service area is required');
  });

  it('validates step 4 correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    let isValid;
    act(() => {
      isValid = result.current.validateStep(4);
    });

    expect(isValid).toBe(false);
    expect(result.current.state.errors.documents).toBe('At least one document is required');
  });

  it('navigates to next step when validation passes', () => {
    const { result } = renderHook(() => useProviderRegistration());

    // Fill required data for step 1
    act(() => {
      result.current.updateFormData('business_name', 'Test Business');
      result.current.updateFormData('business_description', 'A detailed description that is more than 50 characters long');
      result.current.updateFormData('experience_years', 5);
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.step).toBe(2);
  });

  it('does not navigate when validation fails', () => {
    const { result } = renderHook(() => useProviderRegistration());

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.step).toBe(1);
  });

  it('navigates to previous step', () => {
    const { result } = renderHook(() => useProviderRegistration());

    // Go to step 2 first
    act(() => {
      result.current.setStep(2);
    });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.step).toBe(1);
  });

  it('does not go below step 1', () => {
    const { result } = renderHook(() => useProviderRegistration());

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.state.step).toBe(1);
  });

  it('sets documents correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    const mockFiles = [
      new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test2.jpg', { type: 'image/jpeg' })
    ];

    act(() => {
      result.current.setDocuments(mockFiles);
    });

    expect(result.current.state.documents).toEqual(mockFiles);
  });

  it('submits registration successfully', async () => {
    const mockRefreshProfile = vi.fn();
    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      refreshProfile: mockRefreshProfile,
      user: null,
      loading: false,
      signOut: vi.fn()
    });

    // Mock successful document upload
    mockUploadMultipleDocuments.mockResolvedValue({
      success: true,
      filePaths: ['path1', 'path2'],
      errors: []
    });

    const { result } = renderHook(() => useProviderRegistration());

    // Fill all required data
    act(() => {
      result.current.updateFormData('business_name', 'Test Business');
      result.current.updateFormData('business_description', 'A detailed description that is more than 50 characters long');
      result.current.updateFormData('experience_years', 5);
      result.current.updateFormData('full_name', 'John Doe');
      result.current.updateFormData('phone', '+1234567890');
      result.current.updateFormData('address', '123 Main St');
      result.current.updateFormData('city', 'Test City');
      result.current.updateFormData('state', 'Test State');
      result.current.updateFormData('pincode', '12345');
      result.current.updateFormData('skills', ['Plumbing']);
      result.current.updateFormData('service_areas', ['Downtown']);
      result.current.setDocuments([
        new File(['content'], 'test.pdf', { type: 'application/pdf' })
      ]);
    });

    let result_success;
    await act(async () => {
      result_success = await result.current.submitRegistration();
    });

    expect(result_success).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Registration Submitted'
      })
    );
    expect(mockRefreshProfile).toHaveBeenCalled();
  });

  it('handles submission errors', async () => {
    // Mock successful document upload but database error
    mockUploadMultipleDocuments.mockResolvedValue({
      success: true,
      filePaths: ['path1', 'path2'],
      errors: []
    });

    mockSupabase.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      })
    });

    const { result } = renderHook(() => useProviderRegistration());

    // Fill required data
    act(() => {
      result.current.updateFormData('business_name', 'Test Business');
      result.current.updateFormData('business_description', 'A detailed description that is more than 50 characters long');
      result.current.updateFormData('experience_years', 5);
      result.current.updateFormData('full_name', 'John Doe');
      result.current.updateFormData('phone', '+1234567890');
      result.current.updateFormData('address', '123 Main St');
      result.current.updateFormData('city', 'Test City');
      result.current.updateFormData('state', 'Test State');
      result.current.updateFormData('pincode', '12345');
      result.current.updateFormData('skills', ['Plumbing']);
      result.current.updateFormData('service_areas', ['Downtown']);
      result.current.setDocuments([
        new File(['content'], 'test.pdf', { type: 'application/pdf' })
      ]);
    });

    let result_success;
    await act(async () => {
      result_success = await result.current.submitRegistration();
    });

    expect(result_success).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Registration Failed',
        variant: 'destructive'
      })
    );
  });

  it('resets form correctly', () => {
    const { result } = renderHook(() => useProviderRegistration());

    // Set some data first
    act(() => {
      result.current.updateFormData('business_name', 'Test Business');
      result.current.setStep(3);
      result.current.setDocuments([
        new File(['content'], 'test.pdf', { type: 'application/pdf' })
      ]);
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.state).toEqual({
      loading: false,
      step: 1,
      formData: {},
      documents: [],
      errors: {}
    });
  });
});