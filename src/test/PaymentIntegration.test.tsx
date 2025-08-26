import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Stripe first
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmPayment: vi.fn(),
    elements: vi.fn(),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({
    confirmPayment: vi.fn(),
    elements: vi.fn(),
  }),
  useElements: () => ({
    getElement: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }),
  PaymentElement: ({ options }: any) => (
    <div data-testid="payment-element">
      Payment Element - Layout: {options?.layout}
    </div>
  ),
  Elements: ({ children }: any) => <div>{children}</div>,
}));

// Mock the stripe utilities
vi.mock('@/lib/stripe', () => ({
  createPaymentIntent: vi.fn(),
  processRefund: vi.fn(),
  formatCurrency: (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  },
  convertToStripeAmount: (amount: number) => Math.round(amount * 100),
  convertFromStripeAmount: (amount: number) => amount / 100,
  handleStripeError: (error: any) => {
    if (error?.type === 'card_error' || error?.type === 'validation_error') {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  },
  stripePromise: Promise.resolve({
    confirmPayment: vi.fn(),
    elements: vi.fn(),
  }),
  STRIPE_CONFIG: {
    appearance: { theme: 'stripe' },
    loader: 'auto',
  },
}));

// Mock refund utilities
vi.mock('@/lib/refundUtils', () => ({
  checkRefundEligibility: vi.fn(),
  processBookingRefund: vi.fn(),
  calculateRefundAmount: (originalAmount: number, hoursUntilService: number, adminOverride = false) => {
    if (adminOverride) return { amount: originalAmount, percentage: 100 };
    
    let percentage = 100;
    if (hoursUntilService < 0) percentage = 0;
    else if (hoursUntilService < 6) percentage = 25;
    else if (hoursUntilService < 12) percentage = 50;
    else if (hoursUntilService < 24) percentage = 75;
    
    const amount = Math.round((originalAmount * percentage) / 100);
    return { amount, percentage };
  },
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockBookingData, error: null })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null })),
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { Elements } from '@stripe/react-stripe-js';
import PricingBreakdown from '@/components/PricingBreakdown';
import PaymentReceipt from '@/components/PaymentReceipt';
import { 
  createPaymentIntent, 
  processRefund, 
  formatCurrency, 
  convertToStripeAmount,
  convertFromStripeAmount,
  handleStripeError 
} from '@/lib/stripe';
import { 
  checkRefundEligibility, 
  processBookingRefund, 
  calculateRefundAmount 
} from '@/lib/refundUtils';

const mockBookingData = {
  id: 'booking-123',
  service_id: 'service-123',
  provider_id: 'provider-123',
  booking_date: '2024-02-15',
  booking_time: '10:00',
  total_amount: 500,
  customer_address: '123 Test Street',
  payment_status: 'pending',
  service: {
    name: 'House Cleaning',
    description: 'Professional house cleaning service',
    duration_minutes: 120,
  },
  provider: {
    full_name: 'John Doe',
    business_name: 'Clean Pro Services',
  },
};

const mockPaymentData = {
  paymentIntentId: 'pi_test_123',
  amount: 50000, // ₹500 in paise
  currency: 'inr',
  status: 'succeeded' as const,
  bookingIds: ['booking-123'],
  created: Date.now() / 1000,
};

describe('Stripe Integration', () => {
  describe('Utility Functions', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(50000, 'INR')).toBe('₹500');
      expect(formatCurrency(12345, 'INR')).toBe('₹123.45');
      expect(formatCurrency(0, 'INR')).toBe('₹0');
    });

    it('should convert to Stripe amount correctly', () => {
      expect(convertToStripeAmount(500)).toBe(50000);
      expect(convertToStripeAmount(123.45)).toBe(12345);
      expect(convertToStripeAmount(0)).toBe(0);
    });

    it('should convert from Stripe amount correctly', () => {
      expect(convertFromStripeAmount(50000)).toBe(500);
      expect(convertFromStripeAmount(12345)).toBe(123.45);
      expect(convertFromStripeAmount(0)).toBe(0);
    });

    it('should handle Stripe errors correctly', () => {
      const cardError = { type: 'card_error', message: 'Your card was declined.' };
      expect(handleStripeError(cardError)).toBe('Your card was declined.');

      const unknownError = { code: 'unknown_error' };
      expect(handleStripeError(unknownError)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('Payment Intent Creation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create payment intent successfully', async () => {
      const mockResponse = {
        clientSecret: 'pi_mock_123_secret_abc',
        paymentIntentId: 'pi_mock_123',
      };

      vi.mocked(createPaymentIntent).mockResolvedValue(mockResponse);

      const request = {
        amount: 50000,
        currency: 'inr',
        bookingIds: ['booking-123'],
      };

      const response = await createPaymentIntent(request);
      
      expect(response).toEqual(mockResponse);
      expect(createPaymentIntent).toHaveBeenCalledWith(request);
    });
  });

  describe('PricingBreakdown Component', () => {
    const mockPricingItems = [
      {
        id: 'item-1',
        name: 'House Cleaning',
        basePrice: 500,
        duration: 120,
        provider: 'Clean Pro Services',
      },
      {
        id: 'item-2',
        name: 'Deep Cleaning',
        basePrice: 800,
        duration: 180,
        provider: 'Clean Pro Services',
      },
    ];

    it('should render pricing breakdown correctly', () => {
      render(
        <PricingBreakdown
          items={mockPricingItems}
          showDetailedBreakdown={true}
        />
      );

      expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Deep Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('Platform Fee')).toBeInTheDocument();
      expect(screen.getByText('GST')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
    });

    it('should show discount when provided', () => {
      render(
        <PricingBreakdown
          items={mockPricingItems}
          discountAmount={100}
          discountLabel="First Time Discount"
        />
      );

      expect(screen.getByText('First Time Discount')).toBeInTheDocument();
    });
  });

  describe('PaymentReceipt Component', () => {
    const mockReceiptProps = {
      paymentData: mockPaymentData,
      bookingDetails: [{
        id: 'booking-123',
        service_name: 'House Cleaning',
        provider_name: 'Clean Pro Services',
        booking_date: '2024-02-15',
        booking_time: '10:00',
        duration_minutes: 120,
        amount: 500,
        customer_address: '123 Test Street',
      }],
      onClose: vi.fn(),
    };

    it('should render payment receipt correctly', () => {
      render(<PaymentReceipt {...mockReceiptProps} />);

      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      expect(screen.getByText('House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Clean Pro Services')).toBeInTheDocument();
      expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    });

    it('should handle copy receipt details', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      const mockWriteText = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
      });

      render(<PaymentReceipt {...mockReceiptProps} />);

      const copyButton = screen.getByRole('button', { name: /copy details/i });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  describe('Refund Processing', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check refund eligibility correctly', async () => {
      const mockEligibility = {
        eligible: true,
        refundAmount: 500,
        refundPercentage: 100,
      };

      vi.mocked(checkRefundEligibility).mockResolvedValue(mockEligibility);

      const eligibility = await checkRefundEligibility('booking-123');
      
      expect(eligibility).toEqual(mockEligibility);
      expect(checkRefundEligibility).toHaveBeenCalledWith('booking-123');
    });

    it('should calculate refund amount based on time', () => {
      // More than 24 hours - 100% refund
      let result = calculateRefundAmount(1000, 25);
      expect(result).toEqual({ amount: 1000, percentage: 100 });

      // 12-24 hours - 75% refund
      result = calculateRefundAmount(1000, 18);
      expect(result).toEqual({ amount: 750, percentage: 75 });

      // 6-12 hours - 50% refund
      result = calculateRefundAmount(1000, 8);
      expect(result).toEqual({ amount: 500, percentage: 50 });

      // Less than 6 hours - 25% refund
      result = calculateRefundAmount(1000, 3);
      expect(result).toEqual({ amount: 250, percentage: 25 });

      // Service time passed - 0% refund
      result = calculateRefundAmount(1000, -1);
      expect(result).toEqual({ amount: 0, percentage: 0 });
    });

    it('should process refund successfully', async () => {
      const mockResult = {
        success: true,
        refundId: 're_mock_123',
      };

      vi.mocked(processBookingRefund).mockResolvedValue(mockResult);

      const refundRequest = {
        bookingId: 'booking-123',
        reason: 'customer_request' as const,
        refundAmount: 500,
      };

      const result = await processBookingRefund(refundRequest);
      
      expect(result).toEqual(mockResult);
      expect(processBookingRefund).toHaveBeenCalledWith(refundRequest);
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(createPaymentIntent).mockRejectedValue(new Error('Network error'));

      const request = {
        amount: 50000,
        currency: 'inr',
        bookingIds: ['booking-123'],
      };

      await expect(createPaymentIntent(request)).rejects.toThrow('Network error');
    });

    it('should handle invalid booking data', async () => {
      const mockResult = {
        success: false,
        error: 'Booking not found',
      };

      vi.mocked(processBookingRefund).mockResolvedValue(mockResult);

      const refundRequest = {
        bookingId: 'invalid-booking',
        reason: 'customer_request' as const,
      };

      const result = await processBookingRefund(refundRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});