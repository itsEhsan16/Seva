import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/useLocation', () => ({
  useLocation: () => ({
    calculateDistance: vi.fn(),
    location: null,
    loading: false,
    error: null,
    getCurrentLocation: vi.fn(),
  }),
}));

const mockProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  full_name: 'John Doe',
  phone: '+91 9876543210',
  address: '123 Main St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  role: 'customer',
  is_verified: true,
  avatar_url: null,
  verification_status: 'approved',
};

const mockIncompleteProfile = {
  ...mockProfile,
  full_name: null,
  phone: null,
  address: null,
};

describe('useProfileManagement', () => {
  const mockToast = vi.fn();
  const mockRefreshProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useToast as any).mockReturnValue({
      toast: mockToast,
    });

    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  it('should calculate profile completion correctly for complete profile', () => {
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
      refreshProfile: mockRefreshProfile,
    });

    const { result } = renderHook(() => useProfileManagement());

    expect(result.current.isProfileComplete).toBe(true);
    expect(result.current.profileCompletion).toBe(100);
    expect(result.current.missingFields).toEqual([]);
  });

  it('should calculate profile completion correctly for incomplete profile', () => {
    (useAuth as any).mockReturnValue({
      profile: mockIncompleteProfile,
      refreshProfile: mockRefreshProfile,
    });

    const { result } = renderHook(() => useProfileManagement());

    expect(result.current.isProfileComplete).toBe(false);
    expect(result.current.profileCompletion).toBe(50); // 3 out of 6 required fields
    expect(result.current.missingFields).toEqual(['full_name', 'phone', 'address']);
  });

  it('should update profile successfully', async () => {
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
      refreshProfile: mockRefreshProfile,
    });

    const { result } = renderHook(() => useProfileManagement());

    const updateData = {
      full_name: 'Jane Doe',
      phone: '+91 9876543211',
    };

    await act(async () => {
      const success = await result.current.updateProfile(updateData);
      expect(success).toBe(true);
    });

    expect(mockRefreshProfile).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  });

  it('should handle profile update error', async () => {
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
      refreshProfile: mockRefreshProfile,
    });

    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }),
    });

    const { result } = renderHook(() => useProfileManagement());

    const updateData = {
      full_name: 'Jane Doe',
    };

    await act(async () => {
      const success = await result.current.updateProfile(updateData);
      expect(success).toBe(false);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Update Failed",
      description: "Update failed",
      variant: "destructive",
    });
  });

  it('should validate profile data correctly', () => {
    (useAuth as any).mockReturnValue({
      profile: mockProfile,
      refreshProfile: mockRefreshProfile,
    });

    const { result } = renderHook(() => useProfileManagement());

    // Valid data
    const validData = {
      full_name: 'John Doe',
      phone: '+91 9876543210',
      address: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    };

    const validResult = result.current.validateProfileData(validData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // Invalid data
    const invalidData = {
      full_name: '',
      phone: 'invalid-phone',
      pincode: 'invalid-pincode',
    };

    const invalidResult = result.current.validateProfileData(invalidData);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('should handle provider profile requirements', () => {
    const providerProfile = {
      ...mockProfile,
      role: 'provider',
      business_name: null,
    };

    (useAuth as any).mockReturnValue({
      profile: providerProfile,
      refreshProfile: mockRefreshProfile,
    });

    const { result } = renderHook(() => useProfileManagement());

    expect(result.current.isProfileComplete).toBe(false);
    expect(result.current.missingFields).toContain('business_name');
  });
});