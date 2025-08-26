import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, Phone, CheckCircle, XCircle, AlertCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ReviewForm from "./ReviewForm";
import { useHasUserReviewed } from "@/hooks/useReviews";

interface Booking {
  id: string;
  service_id: string;
  provider_id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  customer_address: string;
  customer_notes: string;
  provider_notes: string;
  created_at: string;
  service: {
    name: string;
    description: string;
    image_url: string;
  };
  provider: {
    full_name: string;
    phone: string;
    business_name: string;
  };
}

const BookingHistory = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFormOpen, setReviewFormOpen] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [profile]);

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description, image_url),
          provider:profiles!provider_id(full_name, phone, business_name)
        `)
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50';
      case 'cancelled':
        return 'text-red-700 bg-red-50';
      case 'confirmed':
        return 'text-blue-700 bg-blue-50';
      default:
        return 'text-yellow-700 bg-yellow-50';
    }
  };

  if (loading) {
    return (
      <div className="section-container py-8">
        <div className="text-center">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
          <p className="text-muted-foreground">Book your first service to see it here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="glass-card p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Service Image */}
                <div className="lg:w-48 flex-shrink-0">
                  <img
                    src={booking.service.image_url || "/placeholder.svg"}
                    alt={booking.service.name}
                    className="w-full h-32 lg:h-full object-cover rounded-lg"
                  />
                </div>

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{booking.service.name}</h3>
                      <p className="text-muted-foreground">{booking.service.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-pulse-500" />
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-pulse-500" />
                      <span>{booking.booking_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-pulse-500" />
                      <span>{booking.provider.business_name || booking.provider.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-pulse-500" />
                      <span>{booking.provider.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-pulse-500" />
                    <span>{booking.customer_address}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-pulse-600">
                      ₹{booking.total_amount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Booked on {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {booking.provider_notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Provider Notes:</p>
                      <p className="text-sm">{booking.provider_notes}</p>
                    </div>
                  )}

                  {/* Review Button for Completed Bookings */}
                  {booking.status === 'completed' && (
                    <ReviewButton 
                      bookingId={booking.id}
                      serviceId={booking.service_id}
                      providerId={booking.provider_id}
                      serviceName={booking.service.name}
                      customerId={profile?.id || ''}
                      onReviewClick={() => setReviewFormOpen(booking.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {reviewFormOpen && (
        <ReviewForm
          bookingId={reviewFormOpen}
          serviceId={bookings.find(b => b.id === reviewFormOpen)?.service_id || ''}
          providerId={bookings.find(b => b.id === reviewFormOpen)?.provider_id || ''}
          serviceName={bookings.find(b => b.id === reviewFormOpen)?.service?.name || ''}
          onClose={() => setReviewFormOpen(null)}
          onReviewSubmitted={() => {
            // Optionally refresh bookings or show success message
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};

// Review Button Component
interface ReviewButtonProps {
  bookingId: string;
  serviceId: string;
  providerId: string;
  serviceName: string;
  customerId: string;
  onReviewClick: () => void;
}

const ReviewButton = ({ bookingId, customerId, onReviewClick }: ReviewButtonProps) => {
  const { hasReviewed, loading } = useHasUserReviewed(bookingId, customerId);

  if (loading) {
    return (
      <div className="mt-4">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {hasReviewed ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Review submitted</span>
        </div>
      ) : (
        <Button onClick={onReviewClick} variant="outline" size="sm" className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Leave a Review
        </Button>
      )}
    </div>
  );
};

export default BookingHistory;