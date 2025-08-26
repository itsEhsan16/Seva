import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProviderResponseForm from '@/components/ProviderResponseForm';
import { useProviderResponse } from '@/hooks/useReviews';

// Mock dependencies
vi.mock('@/hooks/useReviews');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockUseProviderResponse = vi.mocked(useProviderResponse);

const mockProps = {
  reviewId: 'review-1',
  customerName: 'John Doe',
  customerRating: 4,
  customerComment: 'Good service but could be better',
  onClose: vi.fn(),
  onResponseSubmitted: vi.fn()
};

describe('ProviderResponseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseProviderResponse.mockReturnValue({
      submitResponse: vi.fn().mockResolvedValue({ success: true }),
      submitting: false
    });
  });

  it('renders provider response form correctly', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    expect(screen.getByText('Respond to Review')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('"Good service but could be better"')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Thank the customer and address their feedback/)).toBeInTheDocument();
  });

  it('renders edit mode when existing response is provided', () => {
    const propsWithExistingResponse = {
      ...mockProps,
      existingResponse: 'Thank you for your feedback!'
    };
    
    render(<ProviderResponseForm {...propsWithExistingResponse} />);
    
    expect(screen.getByText('Edit Response')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Thank you for your feedback!')).toBeInTheDocument();
    expect(screen.getByText('Update Response')).toBeInTheDocument();
  });

  it('displays customer rating with stars', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
  });

  it('shows response guidelines', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    expect(screen.getByText('Response Guidelines:')).toBeInTheDocument();
    expect(screen.getByText('• Thank the customer for their feedback')).toBeInTheDocument();
    expect(screen.getByText('• Keep the tone professional and courteous')).toBeInTheDocument();
  });

  it('updates character count as user types', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/Thank the customer and address their feedback/);
    fireEvent.change(textarea, { target: { value: 'Thank you for your review!' } });
    
    expect(screen.getByText('26/500 characters')).toBeInTheDocument();
  });

  it('submits response successfully', async () => {
    const mockSubmitResponse = vi.fn().mockResolvedValue({ success: true });
    mockUseProviderResponse.mockReturnValue({
      submitResponse: mockSubmitResponse,
      submitting: false
    });

    render(<ProviderResponseForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/Thank the customer and address their feedback/);
    fireEvent.change(textarea, { target: { value: 'Thank you for your feedback! We appreciate your business.' } });
    
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmitResponse).toHaveBeenCalledWith('review-1', 'Thank you for your feedback! We appreciate your business.');
    });
    
    expect(mockProps.onResponseSubmitted).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('prevents submission of empty response', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    const submitButton = screen.getByText('Submit Response');
    expect(submitButton).toBeDisabled();
  });

  it('handles submission error', async () => {
    const mockSubmitResponse = vi.fn().mockResolvedValue({ success: false, error: 'Network error' });
    mockUseProviderResponse.mockReturnValue({
      submitResponse: mockSubmitResponse,
      submitting: false
    });

    render(<ProviderResponseForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/Thank the customer and address their feedback/);
    fireEvent.change(textarea, { target: { value: 'Thank you!' } });
    
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmitResponse).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<ProviderResponseForm {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close response form/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows submitting state', () => {
    mockUseProviderResponse.mockReturnValue({
      submitResponse: vi.fn(),
      submitting: true
    });

    render(<ProviderResponseForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/Thank the customer and address their feedback/);
    fireEvent.change(textarea, { target: { value: 'Thank you!' } });
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });
});