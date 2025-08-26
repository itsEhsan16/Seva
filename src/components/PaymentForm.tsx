import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  stripePromise, 
  STRIPE_CONFIG, 
  formatCurrency, 
  handleStripeError,
  type PaymentConfirmationData 
} from '@/lib/stripe';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  bookingIds: string[];
  onPaymentSuccess: (data: PaymentConfirmationData) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

// Inner payment form component that uses Stripe hooks
const PaymentFormInner = ({ 
  clientSecret, 
  amount, 
  bookingIds, 
  onPaymentSuccess, 
  onPaymentError, 
  onCancel 
}: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system not loaded. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        const errorMsg = handleStripeError(error);
        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
        toast({
          title: 'Payment Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } else if (paymentIntent) {
        // Payment succeeded
        const paymentData: PaymentConfirmationData = {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status as any,
          bookingIds,
          created: paymentIntent.created,
        };

        onPaymentSuccess(paymentData);
        toast({
          title: 'Payment Successful',
          description: `Payment of ${formatCurrency(paymentIntent.amount, paymentIntent.currency.toUpperCase())} completed successfully.`,
        });
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred during payment processing.';
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Secure Payment
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Protected by Stripe</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment amount display */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold">{formatCurrency(amount)}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              For {bookingIds.length} booking{bookingIds.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Stripe Payment Element */}
          <div className="space-y-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'digital_wallet'],
              }}
            />
          </div>

          {/* Error message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Security notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 rounded p-3">
            <Lock className="w-3 h-3" />
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatCurrency(amount)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Main payment form component with Stripe Elements provider
const PaymentForm = (props: PaymentFormProps) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    if (stripePromise) {
      stripePromise.then((stripe) => {
        if (stripe) {
          setStripeLoaded(true);
        }
      });
    }
  }, []);

  if (!stripePromise) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Payment system is not configured. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stripeLoaded) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading payment system...</p>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret: props.clientSecret,
    appearance: STRIPE_CONFIG.appearance,
    loader: STRIPE_CONFIG.loader,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default PaymentForm;