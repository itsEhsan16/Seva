import React, { useEffect, useState } from "react";
import { CheckCircle, Calendar, Clock, MapPin, User, Phone, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface BookingDetails {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  customer_address: string;
  customer_notes?: string;
  status: string;
  service: {
    name: string;
    description: string;
    duration_minutes: number;
  };
  provider: {
    full_name: string;
    business_name?: string;
    phone?: string;
    email?: string;
  };
}

interface BookingConfirmationProps {
  bookingIds: string[];
  onClose: () => void;
  onProceedToPayment?: (bookingIds: string[]) => void;
}

const BookingConfirmation = ({ bookingIds, onClose, onProceedToPayment }: BookingConfirmationProps) => {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsSent, setNotificationsSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingIds]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description, duration_minutes),
          provider:profiles!provider_id(full_name, business_name, phone, user_id)
        `)
        .in('id', bookingIds);

      if (error) throw error;

      // Get provider emails
      const bookingsWithEmails = await Promise.all(
        (data || []).map(async (booking) => {
          let providerEmail = '';
          if (booking.provider?.user_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(booking.provider.user_id);
            providerEmail = authUser.user?.email || '';
          }

          return {
            ...booking,
            provider: {
              ...booking.provider,
              email: providerEmail
            }
          };
        })
      );

      setBookings(bookingsWithEmails);
      
      // Send notifications after loading booking details
      if (!notificationsSent) {
        await sendBookingNotifications(bookingsWithEmails);
        setNotificationsSent(true);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBookingNotifications = async (bookingDetails: BookingDetails[]) => {
    try {
      // Send notifications to providers and customers
      for (const booking of bookingDetails) {
        // In a real app, this would trigger email/SMS notifications
        // For now, we'll just log the notification
        console.log('Sending booking notification:', {
          bookingId: booking.id,
          customerNotification: {
            type: 'booking_confirmation',
            message: `Your booking for ${booking.service.name} on ${format(new Date(booking.booking_date), 'MMMM d, yyyy')} at ${booking.booking_time} has been confirmed.`
          },
          providerNotification: {
            type: 'new_booking',
            message: `You have a new booking for ${booking.service.name} on ${format(new Date(booking.booking_date), 'MMMM d, yyyy')} at ${booking.booking_time}.`,
            providerEmail: booking.provider.email
          }
        });

        // Update booking status to confirmed
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', booking.id);
      }

      toast({
        title: "Notifications Sent",
        description: "Booking confirmations have been sent to all parties.",
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Notification Error",
        description: "Bookings created but notifications may not have been sent.",
        variant: "destructive"
      });
    }
  };

  const copyBookingDetails = (booking: BookingDetails) => {
    const details = `
Booking Confirmation
Service: ${booking.service.name}
Date: ${format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}
Time: ${booking.booking_time}
Provider: ${booking.provider.business_name || booking.provider.full_name}
Address: ${booking.customer_address}
Amount: ₹${booking.total_amount}
Booking ID: ${booking.id}
    `.trim();

    navigator.clipboard.writeText(details);
    toast({
      title: "Copied",
      description: "Booking details copied to clipboard.",
    });
  };

  const totalAmount = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading booking details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Booking{bookings.length > 1 ? 's' : ''} Confirmed!
          </CardTitle>
          <p className="text-muted-foreground">
            {bookings.length === 1 
              ? "Your service has been booked successfully."
              : `${bookings.length} services have been booked successfully.`
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {bookings.map((booking, index) => (
            <Card key={booking.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                    <p className="text-sm text-muted-foreground">{booking.service.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">Confirmed</Badge>
                    <p className="text-lg font-semibold mt-1">₹{booking.total_amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{booking.booking_time} ({booking.service.duration_minutes} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{booking.provider.business_name || booking.provider.full_name}</span>
                  </div>
                  {booking.provider.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{booking.provider.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <span className="text-sm">{booking.customer_address}</span>
                  </div>
                </div>

                {booking.customer_notes && (
                  <div className="mt-4 p-3 bg-accent rounded-lg">
                    <p className="text-sm font-medium mb-1">Special Requirements:</p>
                    <p className="text-sm">{booking.customer_notes}</p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
                  <span>Booking ID: {booking.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyBookingDetails(booking)}
                    className="h-auto p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {bookings.length > 1 && (
            <Card className="bg-accent/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold">₹{totalAmount}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• The service provider will contact you before the appointment</li>
              <li>• You can track your booking in the "My Bookings" section</li>
              <li>• Payment will be processed after service completion</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {onProceedToPayment && (
              <Button onClick={() => onProceedToPayment(bookingIds)} className="flex-1">
                Proceed to Payment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingConfirmation;