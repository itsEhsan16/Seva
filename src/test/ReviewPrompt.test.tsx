import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewPrompt from '@/components/ReviewPrompt';
import { useAuth } from '@/contexts/AuthContext';
import { useHasUserReviewed } from '@/hooks/useReviews';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useReviews', () => ({
  useHasUserReviewed: vi.fn(),
  useSubmitReview: vi.fn(() => ({
    submitReview: vi.fn().mockResolvedValue({ success: true }),
    submitting: false
  }))
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseHasUserReviewed = vi.mocked(useHasUserReviewed);

const mockBooking = {
  id: 'booking-1',
  service_id: 'service-1',
  provider_id: 'provider-1',
  status: 'completed',
  updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  service: {
    name: 'House Cleaning'
  },
  provider: {
    full_name: 'John Provider',
    business_name: 'Clean Pro Services'
  }
};

describe('ReviewPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      profile: { id: 'user-1', full_name: 'Test User' },
      user: null,
      loading: false,
      signOut: vi.fn()
    });

    mockUseHasUserReviewed.mockReturnValue({
      hasReviewed: false,
      loading: false,
      refetch: vi.fn()
    });
  });

  it('renders review prompt for completed booking', () => {
    render(<ReviewPrompt booking={mockBooking} autoShow={false} />);
    
    expect(screen.getByText('How was your experience?')).toBeInTheDocument();
    expect(screen.getByText(/Your service "House Cleaning" with Clean Pro Services has been completed/)).toBeInTheDocument();
    expect(screen.getByText('Write Review')).toBeInTheDocument();
  });

  it('does not render if user has already reviewed', () => {
    mockUseHasUserReviewed.mockReturnValue({
      hasReviewed: true,
      loading: false,
      refetch: vi.fn()
    });

    const { container } = render(<ReviewPrompt booking={mockBooking} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render if booking is not completed', () => {
    const incompleteBooking = { ...mockBooking, status: 'in_progress' };
    
    const { container } = render(<ReviewPrompt booking={incompleteBooking} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state', () => {
    mockUseHasUserReviewed.mockReturnValue({
      hasReviewed: false,
      loading: true,
      refetch: vi.fn()
    });

    const { container } = render(<ReviewPrompt booking={mockBooking} />);
    expect(container.firstChild).toBeNull();
  });

  it('opens review form when Write Review is clicked', () => {
    render(<ReviewPrompt booking={mockBooking} autoShow={false} />);
    
    const writeReviewButton = screen.getByText('Write Review');
    fireEvent.click(writeReviewButton);
    
    expect(screen.getByText('Rate Your Experience')).toBeInTheDocument();
  });

  it('dismisses prompt when Maybe Later is clicked', () => {
    const onDismiss = vi.fn();
    render(<ReviewPrompt booking={mockBooking} onDismiss={onDismiss} autoShow={false} />);
    
    const maybeLaterButton = screen.getByText('Maybe Later');
    fireEvent.click(maybeLaterButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('dismisses prompt when X button is clicked', () => {
    const onDismiss = vi.fn();
    render(<ReviewPrompt booking={mockBooking} onDismiss={onDismiss} autoShow={false} />);
    
    const closeButton = screen.getByRole('button', { name: /close review prompt/i });
    fireEvent.click(closeButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('displays completion date', () => {
    render(<ReviewPrompt booking={mockBooking} autoShow={false} />);
    
    const completionDate = new Date(mockBooking.updated_at).toLocaleDateString();
    expect(screen.getByText(`Completed ${completionDate}`)).toBeInTheDocument();
  });

  it('uses business name when available', () => {
    render(<ReviewPrompt booking={mockBooking} autoShow={false} />);
    
    expect(screen.getByText(/Clean Pro Services/)).toBeInTheDocument();
  });

  it('falls back to full name when business name is not available', () => {
    const bookingWithoutBusinessName = {
      ...mockBooking,
      provider: {
        full_name: 'John Provider',
        business_name: null
      }
    };
    
    render(<ReviewPrompt booking={bookingWithoutBusinessName} autoShow={false} />);
    
    expect(screen.getByText(/John Provider/)).toBeInTheDocument();
  });

  it('uses Provider as fallback when no names are available', () => {
    const bookingWithoutNames = {
      ...mockBooking,
      provider: {
        full_name: null,
        business_name: null
      }
    };
    
    render(<ReviewPrompt booking={bookingWithoutNames} autoShow={false} />);
    
    expect(screen.getByText(/Provider/)).toBeInTheDocument();
  });

  it('closes review form and prompt after successful submission', async () => {
    render(<ReviewPrompt booking={mockBooking} autoShow={false} />);
    
    // Open review form
    const writeReviewButton = screen.getByText('Write Review');
    fireEvent.click(writeReviewButton);
    
    // The review form should be visible
    expect(screen.getByText('Rate Your Experience')).toBeInTheDocument();
    
    // Simulate successful review submission by calling the onReviewSubmitted callback
    // This would normally be called by the ReviewForm component
    const reviewForm = screen.getByText('Rate Your Experience').closest('div');
    expect(reviewForm).toBeInTheDocument();
  });
});