import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminUsers from '@/components/AdminUsers';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/documentUtils');

const mockUseToast = vi.mocked(useToast);
const mockSupabase = vi.mocked(supabase);

const mockToast = vi.fn();

const mockUsers = [
  {
    id: 'user-1',
    user_id: 'user-1',
    full_name: 'John Customer',
    phone: '+1234567890',
    role: 'customer',
    city: 'Test City',
    state: 'Test State',
    is_verified: true,
    verification_status: 'approved',
    business_name: null,
    experience_years: null,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    user_id: 'user-2',
    full_name: 'Jane Provider',
    phone: '+1234567891',
    role: 'provider',
    city: 'Provider City',
    state: 'Provider State',
    is_verified: false,
    verification_status: 'pending',
    business_name: 'Jane Services',
    experience_years: 5,
    created_at: '2024-01-02T00:00:00Z',
    verification_documents: ['doc1.pdf', 'doc2.jpg'],
    business_description: 'Professional cleaning services',
    skills: ['Cleaning', 'Organizing'],
    service_areas: ['Downtown', 'Suburbs']
  },
  {
    id: 'user-3',
    user_id: 'user-3',
    full_name: 'Bob Rejected',
    phone: '+1234567892',
    role: 'provider',
    city: 'Rejected City',
    state: 'Rejected State',
    is_verified: false,
    verification_status: 'rejected',
    business_name: 'Bob Services',
    experience_years: 2,
    created_at: '2024-01-03T00:00:00Z',
    rejection_reason: 'Insufficient documentation provided'
  }
];

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      toast: mockToast
    });

    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    });
  });

  it('renders user management interface', async () => {
    render(<AdminUsers />);
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Customer')).toBeInTheDocument();
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
      expect(screen.getByText('Bob Rejected')).toBeInTheDocument();
    });
  });

  it('filters users by search term', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('John Customer')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
      expect(screen.queryByText('John Customer')).not.toBeInTheDocument();
    });
  });

  it('filters users by role', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('John Customer')).toBeInTheDocument();
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
    });

    // Find and click the role filter
    const roleFilter = screen.getByDisplayValue('All Roles');
    fireEvent.click(roleFilter);
    
    const providerOption = screen.getByText('Provider');
    fireEvent.click(providerOption);

    await waitFor(() => {
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
      expect(screen.queryByText('John Customer')).not.toBeInTheDocument();
    });
  });

  it('filters users by status', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
      expect(screen.getByText('Bob Rejected')).toBeInTheDocument();
    });

    // Find and click the status filter
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.click(statusFilter);
    
    const pendingOption = screen.getByText('Pending');
    fireEvent.click(pendingOption);

    await waitFor(() => {
      expect(screen.getByText('Jane Provider')).toBeInTheDocument();
      expect(screen.queryByText('Bob Rejected')).not.toBeInTheDocument();
    });
  });

  it('shows review button for pending providers', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      const janeCard = screen.getByText('Jane Provider').closest('.p-6');
      expect(janeCard).toBeInTheDocument();
      
      const reviewButton = janeCard?.querySelector('button');
      expect(reviewButton).toHaveTextContent('Review');
    });
  });

  it('opens provider details dialog', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      const reviewButton = screen.getByText('Review');
      fireEvent.click(reviewButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Provider Application Details')).toBeInTheDocument();
      expect(screen.getByText('Jane Services')).toBeInTheDocument();
      expect(screen.getByText('Professional cleaning services')).toBeInTheDocument();
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Downtown')).toBeInTheDocument();
    });
  });

  it('approves provider successfully', async () => {
    render(<AdminUsers />);
    
    // Open details dialog
    await waitFor(() => {
      const reviewButton = screen.getByText('Review');
      fireEvent.click(reviewButton);
    });

    // Click approve button
    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Provider Approved'
      })
    );
  });

  it('rejects provider with feedback', async () => {
    render(<AdminUsers />);
    
    // Open details dialog
    await waitFor(() => {
      const reviewButton = screen.getByText('Review');
      fireEvent.click(reviewButton);
    });

    // Click reject button
    await waitFor(() => {
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);
    });

    // Fill rejection reason
    await waitFor(() => {
      const reasonTextarea = screen.getByPlaceholderText('Enter rejection reason...');
      fireEvent.change(reasonTextarea, { 
        target: { value: 'Documents are not clear enough' } 
      });
    });

    // Submit rejection
    const submitRejectButton = screen.getByText('Reject Application');
    fireEvent.click(submitRejectButton);

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Provider Rejected'
      })
    );
  });

  it('shows rejection reason for rejected providers', async () => {
    render(<AdminUsers />);
    
    // Find and click view button for rejected provider
    await waitFor(() => {
      const bobCard = screen.getByText('Bob Rejected').closest('.p-6');
      const viewButton = bobCard?.querySelector('button');
      if (viewButton) {
        fireEvent.click(viewButton);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
      expect(screen.getByText('Insufficient documentation provided')).toBeInTheDocument();
    });
  });

  it('handles verification for non-provider users', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      const johnCard = screen.getByText('John Customer').closest('.p-6');
      const unverifyButton = johnCard?.querySelector('button');
      if (unverifyButton) {
        fireEvent.click(unverifyButton);
      }
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success'
      })
    );
  });

  it('handles API errors gracefully', async () => {
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('API Error')
        })
      })
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to fetch users'
        })
      );
    });
  });

  it('shows loading state initially', () => {
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      })
    });

    render(<AdminUsers />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-spin');
  });

  it('shows empty state when no users found', async () => {
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    });

    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });
});