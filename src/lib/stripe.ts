import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment functionality will be disabled.');
}

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  },
  loader: 'auto' as const,
};

// Payment intent creation interface
export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string;
  bookingIds: string[];
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Mock payment intent creation (in real app, this would be a server endpoint)
export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> => {
  // In a real application, this would be a server-side endpoint
  // For now, we'll simulate the response
  
  // Validate amount
  if (request.amount < 50) { // Minimum 50 cents
    throw new Error('Amount must be at least ₹0.50');
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate mock client secret (in real app, this comes from Stripe)
  const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
  const mockPaymentIntentId = `pi_mock_${Date.now()}`;

  return {
    clientSecret: mockClientSecret,
    paymentIntentId: mockPaymentIntentId,
  };
};

// Payment confirmation interface
export interface PaymentConfirmationData {
  paymentIntentId: string;
  paymentMethodId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'requires_action' | 'failed';
  bookingIds: string[];
  receiptUrl?: string;
  created: number;
}

// Process refund interface
export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // If not provided, full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  bookingId: string;
}

export interface RefundResponse {
  refundId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  created: number;
}

// Mock refund processing (in real app, this would be a server endpoint)
export const processRefund = async (
  request: RefundRequest
): Promise<RefundResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock refund response
  const mockRefundId = `re_mock_${Date.now()}`;

  return {
    refundId: mockRefundId,
    amount: request.amount || 0,
    status: 'succeeded',
    created: Date.now(),
  };
};

// Pricing utilities
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100); // Convert from cents
};

export const convertToStripeAmount = (amount: number): number => {
  // Convert rupees to paise (Stripe expects amounts in smallest currency unit)
  return Math.round(amount * 100);
};

export const convertFromStripeAmount = (amount: number): number => {
  // Convert paise to rupees
  return amount / 100;
};

// Payment method types supported
export const SUPPORTED_PAYMENT_METHODS = [
  'card',
  'upi',
  'netbanking',
  'wallet',
] as const;

export type SupportedPaymentMethod = typeof SUPPORTED_PAYMENT_METHODS[number];

// Error handling for Stripe errors
export const handleStripeError = (error: any): string => {
  if (error?.type === 'card_error' || error?.type === 'validation_error') {
    return error.message;
  }
  
  switch (error?.code) {
    case 'card_declined':
      return 'Your card was declined. Please try a different payment method.';
    case 'expired_card':
      return 'Your card has expired. Please use a different card.';
    case 'incorrect_cvc':
      return 'Your card\'s security code is incorrect.';
    case 'processing_error':
      return 'An error occurred while processing your card. Please try again.';
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};