import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  const handleRetryPayment = () => {
    if (bookingId) {
      // Navigate back to booking page with the booking ID to retry payment
      navigate(`/booking?retry=${bookingId}`);
    } else {
      navigate('/booking');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <XCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Payment Cancelled</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-destructive">
              Your payment was cancelled. Your booking is still pending and will be automatically cancelled if payment is not completed within 24 hours.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't worry - no charges were made to your account. You can:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Try the payment again</li>
              <li>• Modify your booking details</li>
              <li>• Contact support if you need help</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetryPayment}>
              Try Payment Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/booking-history')}>
              View My Bookings
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}