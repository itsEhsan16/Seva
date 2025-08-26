import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileCompletionProgress from '@/components/ProfileCompletionProgress';
import { useProfileManagement } from '@/hooks/useProfileManagement';

// Mock dependencies
vi.mock('@/hooks/useProfileManagement');

const mockCompleteProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  full_name: 'John Doe',
  phone: '+91 9876543210',
  address: '123 Main St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  role: 'customer',
};

const mockIncompleteProfile = {
  ...mockCompleteProfile,
  full_name: null,
  phone: null,
  address: null,
};

describe('ProfileCompletionProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show complete status for complete profile', () => {
    (useProfileManagement as any).mockReturnValue({
      profile: mockCompleteProfile,
      profileCompletion: 100,
      missingFields: [],
      isProfileComplete: true,
    });

    render(<ProfileCompletionProgress />);

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Profile Complete!')).toBeInTheDocument();
  });

  it('should show incomplete status for incomplete profile', () => {
    (useProfileManagement as any).mockReturnValue({
      profile: mockIncompleteProfile,
      profileCompletion: 50,
      missingFields: ['full_name', 'phone', 'address'],
      isProfileComplete: false,
    });

    render(<ProfileCompletionProgress />);

    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Complete your profile to unlock all features')).toBeInTheDocument();
  });
});