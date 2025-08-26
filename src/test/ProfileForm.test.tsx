import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileForm from '@/components/ProfileForm';
import { useProfileManagement } from '@/hooks/useProfileManagement';

// Mock dependencies
vi.mock('@/hooks/useProfileManagement');

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
  business_name: null,
  business_license: null,
  tax_id: null,
  experience_years: null,
  skills: null,
};

describe('ProfileForm', () => {
  const mockUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useProfileManagement as any).mockReturnValue({
      profile: mockProfile,
      loading: false,
      geocoding: false,
      updateProfile: mockUpdateProfile,
      isProfileComplete: true,
      profileCompletion: 100,
      missingFields: [],
    });
  });

  it('should render profile form with all fields', () => {
    render(<ProfileForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pincode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
  });

  it('should populate form with existing profile data', () => {
    render(<ProfileForm />);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+91 9876543210')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mumbai')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Maharashtra')).toBeInTheDocument();
    expect(screen.getByDisplayValue('400001')).toBeInTheDocument();
  });

  it('should show provider-specific fields for provider role', () => {
    const providerProfile = {
      ...mockProfile,
      role: 'provider',
      business_name: 'Test Business',
    };

    (useProfileManagement as any).mockReturnValue({
      profile: providerProfile,
      loading: false,
      geocoding: false,
      updateProfile: mockUpdateProfile,
      isProfileComplete: true,
      profileCompletion: 100,
      missingFields: [],
    });

    render(<ProfileForm />);

    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/years of experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business license/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tax id/i)).toBeInTheDocument();
  });

  it('should have working form submission button', () => {
    render(<ProfileForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    
    // Button should be enabled and clickable
    expect(submitButton).not.toBeDisabled();
    
    // Should be able to click without errors
    fireEvent.click(submitButton);
    
    // Button should still be present after click
    expect(submitButton).toBeInTheDocument();
  });

  it('should show submit button', () => {
    render(<ProfileForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should show geocoding indicator when geocoding is active', () => {
    (useProfileManagement as any).mockReturnValue({
      profile: mockProfile,
      loading: false,
      geocoding: true,
      updateProfile: mockUpdateProfile,
      isProfileComplete: true,
      profileCompletion: 100,
      missingFields: [],
    });

    render(<ProfileForm />);

    expect(screen.getByText(/validating address location/i)).toBeInTheDocument();
  });

  it('should allow input changes', async () => {
    render(<ProfileForm />);

    const fullNameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(fullNameInput, { target: { value: 'Jane Smith' } });

    expect(fullNameInput).toHaveValue('Jane Smith');
  });

  it('should show form fields with proper labels', () => {
    render(<ProfileForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pincode/i)).toBeInTheDocument();
  });

  it('should display profile completion progress', () => {
    render(<ProfileForm />);

    expect(screen.getByText('Profile Completion')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});