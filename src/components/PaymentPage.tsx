import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PaymentForm from './PaymentForm';
import PricingBreakdown from './PricingBreakdown';
import PaymentReceipt from './PaymentReceipt';
import { 
  createPaymentIntent, 
  convertToStripeAmount,
  type CreatePaymentIntentRequest,
  type PaymentConfirmationData 
} from '@/lib/stripe';

interface BookingDetails {
  id: string;
  service_id: string;
  provider_id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  customer_address: string;
  service: {
    name: string;
    description: string;
    duration_minutes: number;
  };
  provider: {
    full_name: string;
    business_name?: string;
  };
}

interface PaymentPageProps {
  bookingIds: string[];
  onBack: () => void;
  onPaymentComplete: () => void;
}

const PaymentPage = ({ bookingIds, onBack, onPaymentComplete }: PaymentPageProps) => {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentConfirmationData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingIds]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description, duration_minutes),
          provider:profiles!provider_id(full_name, business_name)
        `)
        .in('id', bookingIds)
        .eq('payment_status', 'pending');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        throw new Error('No pending bookings found');
      }

      setBookings(data);
      await initializePayment(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load booking details';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = async (bookingData: BookingDetails[]) => {
    try {
      const totalAmount = bookingData.reduce((sum, booking) => sum + booking.total_amount, 0);
      const stripeAmount = convertToStripeAmount(totalAmount);

      const paymentRequest: CreatePaymentIntentRequest = {
        amount: stripeAmount,
        currency: 'inr',
        bookingIds: bookingData.map(b => b.id),
        metadata: {
          booking_count: bookingData.length.toString(),
          customer_id: bookingData[0]?.customer_id || '',
        },
      };

      const response = await createPaymentIntent(paymentRequest);
      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = async (data: PaymentConfirmationData) => {
    try {
      // Update booking payment status in database
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          payment_id: data.paymentIntentId,
          payment_method: 'card', // This would come from Stripe in real implementation
          status: 'confirmed',
        })
        .in('id', bookingIds);

      if (updateError) throw updateError;

      setPaymentData(data);
      setShowReceipt(true);

      toast({
        title: 'Payment Successful',
        description: 'Your booking has been confirmed and payment processed.',
      });
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast({
        title: 'Warning',
        description: 'Payment successful but there was an issue updating booking status.',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      title: 'Payment Failed',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    onPaymentComplete();
  };

  // Prepare pricing items for breakdown
  const pricingItems = bookings.map(booking => ({
    id: booking.id,
    name: booking.service.name,
    basePrice: booking.total_amount,
    duration: booking.service.duration_minutes,
    provider: booking.provider.business_name || booking.provider.full_name,
  }));

  const totalAmount = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="section-container py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={onBack}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-semibold text-foreground">Payment</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </div>
        
        <div className="section-container py-12">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={onBack} className="w-full mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showReceipt && paymentData) {
    const receiptBookings = bookings.map(booking => ({
      id: booking.id,
      service_name: booking.service.name,
      provider_name: booking.provider.business_name || booking.provider.full_name,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      duration_minutes: booking.service.duration_minutes,
      amount: booking.total_amount,
      customer_address: booking.customer_address,
    }));

    return (
      <PaymentReceipt
        paymentData={paymentData}
        bookingDetails={receiptBookings}
        onClose={handleReceiptClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="section-container py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-foreground">Complete Payment</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="section-container py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pricing Breakdown */}
            <div className="order-2 lg:order-1">
              <PricingBreakdown
                items={pricingItems}
                showDetailedBreakdown={true}
              />
            </div>

            {/* Payment Form */}
            <div className="order-1 lg:order-2">
              {clientSecret ? (
                <PaymentForm
                  clientSecret={clientSecret}
                  amount={convertToStripeAmount(totalAmount)}
                  bookingIds={bookingIds}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  onCancel={onBack}
                />
              ) : (
                <Card className="w-full max-w-md mx-auto">
                  <CardContent className="p-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Initializing payment...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;