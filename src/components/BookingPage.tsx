import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import EnhancedBookingForm from "./EnhancedBookingForm";
import BookingConfirmation from "./BookingConfirmation";
import PaymentPage from "./PaymentPage";

interface BookingPageProps {
  onBack: () => void;
}

const BookingPage = ({ onBack }: BookingPageProps) => {
  const { cart, clearCart } = useCartContext();
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const handleBookingSuccess = (newBookingIds: string[]) => {
    setBookingIds(newBookingIds);
    setShowConfirmation(true);
    clearCart();
  };

  const handleProceedToPayment = (paymentBookingIds: string[]) => {
    setBookingIds(paymentBookingIds);
    setShowConfirmation(false);
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setShowConfirmation(false);
    onBack();
  };

  const handleBackFromPayment = () => {
    setShowPayment(false);
    setShowConfirmation(true);
  };

  if (showPayment) {
    return (
      <PaymentPage
        bookingIds={bookingIds}
        onBack={handleBackFromPayment}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  if (showConfirmation) {
    return (
      <BookingConfirmation
        bookingIds={bookingIds}
        onClose={() => {
          setShowConfirmation(false);
          onBack();
        }}
        onProceedToPayment={handleProceedToPayment}
      />
    );
  }

  // If no items in cart, show empty state
  if (cart.items.length === 0) {
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
              <h1 className="text-xl font-semibold text-foreground">Book Service</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </div>
        <div className="section-container py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">No Services Selected</h2>
          <p className="text-muted-foreground mb-6">Please select a service to book.</p>
          <button onClick={onBack} className="button-primary">
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  // For now, handle single service booking (can be extended for multiple services)
  const firstService = cart.items[0];

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
            <h1 className="text-xl font-semibold text-foreground">Book Service</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="section-container py-6">
        <div className="max-w-4xl mx-auto">
          <EnhancedBookingForm
            serviceId={firstService.id}
            providerId={firstService.providerId || ''}
            serviceName={firstService.name}
            serviceDuration={firstService.durationMinutes || 60}
            servicePrice={firstService.price}
            onBookingSuccess={handleBookingSuccess}
            onCancel={onBack}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;