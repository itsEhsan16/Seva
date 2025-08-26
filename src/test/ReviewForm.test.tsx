import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewForm from '@/components/ReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmitReview } from '@/hooks/useReviews';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useReviews');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseSubmitReview = vi.mocked(useSubmitReview);

const mockProps = {
  bookingId: 'booking-1',
  serviceId: 'service-1',
  providerId: 'provider-1',
  serviceName: 'House Cleaning',
  onClose: vi.fn(),
  onReviewSubmitted: vi.fn()
};

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      profile: { id: 'user-1', full_name: 'Test User' },
      user: null,
      loading: false,
      signOut: vi.fn()
    });

    mockUseSubmitReview.mockReturnValue({
      submitReview: vi.fn().mockResolvedValue({ success: true }),
      submitting: false
    });
  });

  it('renders review form correctly', () => {
    render(<ReviewForm {...mockProps} />);
    
    expect(screen.getByText('Rate Your Experience')).toBeInTheDocument();
    expect(screen.getByText('Service: House Cleaning')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your experience with this service...')).toBeInTheDocument();
  });

  it('allows rating selection', () => {
    render(<ReviewForm {...mockProps} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')?.classList.contains('w-8')
    );
    
    fireEvent.click(stars[3]); // Click 4th star (4-star rating)
    
    // Check if the stars are filled correctly
    expect(stars[3].querySelector('svg')).toHaveClass('fill-yellow-400');
  });

  it('shows content moderation warning for inappropriate content', async () => {
    render(<ReviewForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText('Share your experience with this service...');
    fireEvent.change(textarea, { target: { value: 'This service was damn terrible' } });
    
    await waitFor(() => {
      expect(screen.getByText('Content Review Notice:')).toBeInTheDocument();
    });
  });

  it('submits review successfully', async () => {
    const mockSubmitReview = vi.fn().mockResolvedValue({ success: true });
    mockUseSubmitReview.mockReturnValue({
      submitReview: mockSubmitReview,
      submitting: false
    });

    render(<ReviewForm {...mockProps} />);
    
    // Select rating
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')?.classList.contains('w-8')
    );
    fireEvent.click(stars[4]); // 5-star rating
    
    // Add comment
    const textarea = screen.getByPlaceholderText('Share your experience with this service...');
    fireEvent.change(textarea, { target: { value: 'Excellent service!' } });
    
    // Submit form
    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith({
        bookingId: 'booking-1',
        customerId: 'user-1',
        providerId: 'provider-1',
        serviceId: 'service-1',
        rating: 5,
        comment: 'Excellent service!'
      });
    });
  });

  it('prevents submission without rating', () => {
    render(<ReviewForm {...mockProps} />);
    
    const submitButton = screen.getByText('Submit Review');
    expect(submitButton).toBeDisabled();
  });

  it('handles submission error', async () => {
    const mockSubmitReview = vi.fn().mockResolvedValue({ success: false, error: 'Network error' });
    mockUseSubmitReview.mockReturnValue({
      submitReview: mockSubmitReview,
      submitting: false
    });

    render(<ReviewForm {...mockProps} />);
    
    // Select rating and submit
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')?.classList.contains('w-8')
    );
    fireEvent.click(stars[4]);
    
    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalled();
    });
  });

  it('shows character count for comment', () => {
    render(<ReviewForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText('Share your experience with this service...');
    fireEvent.change(textarea, { target: { value: 'Great service' } });
    
    expect(screen.getByText('13/500 characters')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ReviewForm {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<ReviewForm {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close review form/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});