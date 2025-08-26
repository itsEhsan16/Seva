import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistration } from '@/components/ProviderRegistration';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/hooks/useProviderRegistration');
vi.mock('@/lib/documentUtils');

const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);

const mockProfile = {
  id: 'test-user-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  role: 'customer',
  verification_status: 'pending'
};

const mockToast = vi.fn();

// Mock the useProviderRegistration hook
const mockUseProviderRegistration = {
  state: {
    loading: false,
    step: 1,
    formData: {},
    documents: [],
    errors: {}
  },
  updateFormData: vi.fn(),
  setDocuments: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  submitRegistration: vi.fn(),
  resetForm: vi.fn()
};

vi.mock('@/hooks/useProviderRegistration', () => ({
  useProviderRegistration: () => mockUseProviderRegistration
}));

describe('ProviderRegistration', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn()
  };

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

    // Reset mock state
    mockUseProviderRegistration.state = {
      loading: false,
      step: 1,
      formData: {},
      documents: [],
      errors: {}
    };
  });

  it('renders the registration form when open', () => {
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByText('Become a Service Provider')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getAllByText('Business Info')).toHaveLength(2); // One in step indicator, one as title
  });

  it('does not render when closed', () => {
    render(<ProviderRegistration {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Become a Service Provider')).not.toBeInTheDocument();
  });

  it('shows step 1 content correctly', () => {
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/years of experience/i)).toBeInTheDocument();
  });

  it('shows step 2 content when on step 2', () => {
    mockUseProviderRegistration.state.step = 2;
    
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('shows step 3 content when on step 3', () => {
    mockUseProviderRegistration.state.step = 3;
    
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    expect(screen.getByText(/Skills.*Expertise/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a skill...')).toBeInTheDocument();
  });

  it('shows step 4 content when on step 4', () => {
    mockUseProviderRegistration.state.step = 4;
    
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload verification documents/i)).toBeInTheDocument();
  });

  it('calls nextStep when Next button is clicked', () => {
    render(<ProviderRegistration {...mockProps} />);
    
    fireEvent.click(screen.getByText('Next'));
    
    expect(mockUseProviderRegistration.nextStep).toHaveBeenCalled();
  });

  it('calls prevStep when Previous button is clicked on step 2', () => {
    mockUseProviderRegistration.state.step = 2;
    
    render(<ProviderRegistration {...mockProps} />);
    
    fireEvent.click(screen.getByText('Previous'));
    
    expect(mockUseProviderRegistration.prevStep).toHaveBeenCalled();
  });

  it('shows Submit Application button on final step', () => {
    mockUseProviderRegistration.state.step = 4;
    
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByText('Submit Application')).toBeInTheDocument();
  });

  it('calls submitRegistration when Submit Application is clicked', async () => {
    mockUseProviderRegistration.state.step = 4;
    mockUseProviderRegistration.submitRegistration.mockResolvedValue(true);
    
    render(<ProviderRegistration {...mockProps} />);
    
    fireEvent.click(screen.getByText('Submit Application'));
    
    expect(mockUseProviderRegistration.submitRegistration).toHaveBeenCalled();
  });

  it('calls onSuccess when registration is successful', async () => {
    mockUseProviderRegistration.state.step = 4;
    mockUseProviderRegistration.submitRegistration.mockResolvedValue(true);
    
    render(<ProviderRegistration {...mockProps} />);
    
    fireEvent.click(screen.getByText('Submit Application'));
    
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', () => {
    mockUseProviderRegistration.state.step = 4;
    mockUseProviderRegistration.state.loading = true;
    
    render(<ProviderRegistration {...mockProps} />);
    
    const submitButton = screen.getByText('Submit Application');
    expect(submitButton).toBeDisabled();
  });

  it('displays validation errors', () => {
    mockUseProviderRegistration.state.errors = {
      business_name: 'Business name is required',
      business_description: 'Business description is required'
    };
    
    render(<ProviderRegistration {...mockProps} />);
    
    expect(screen.getByText('Business name is required')).toBeInTheDocument();
    expect(screen.getByText('Business description is required')).toBeInTheDocument();
  });

  it('calls updateFormData when input values change', () => {
    render(<ProviderRegistration {...mockProps} />);
    
    const businessNameInput = screen.getByLabelText(/business name/i);
    fireEvent.change(businessNameInput, { target: { value: 'Test Business' } });
    
    expect(mockUseProviderRegistration.updateFormData).toHaveBeenCalledWith('business_name', 'Test Business');
  });

  it('closes dialog when cancel is clicked', () => {
    render(<ProviderRegistration {...mockProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockProps.onClose).toHaveBeenCalled();
    expect(mockUseProviderRegistration.resetForm).toHaveBeenCalled();
  });
});