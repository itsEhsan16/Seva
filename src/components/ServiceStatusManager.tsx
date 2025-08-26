import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProviderBookings } from "@/hooks/useProviderBookings";
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Play,
  Pause
} from "lucide-react";
import { format } from "date-fns";

interface ServiceStatusManagerProps {
  bookingId?: string;
}

export const ServiceStatusManager: React.FC<ServiceStatusManagerProps> = ({ bookingId }) => {
  const { bookings, updateBookingStatus } = useProviderBookings();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(bookingId || null);
  const [providerNotes, setProviderNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const activeBookings = bookings.filter(booking => 
    ['confirmed', 'in_progress'].includes(booking.status)
  );

  const selectedBookingData = bookings.find(b => b.id === selectedBooking);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedBooking) return;

    setLoading(true);
    try {
      const { error } = await updateBookingStatus(
        selectedBooking, 
        newStatus, 
        providerNotes || undefined
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Status Updated",
          description: `Booking status updated to ${newStatus}.`,
        });
        setProviderNotes("");
        if (newStatus === 'completed') {
          setSelectedBooking(null);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextActions = (status: string) => {
    switch (status) {
      case 'confirmed':
        return [
          { action: 'in_progress', label: 'Start Service', icon: Play, variant: 'default' as const },
          { action: 'cancelled', label: 'Cancel', icon: AlertCircle, variant: 'destructive' as const }
        ];
      case 'in_progress':
        return [
          { action: 'completed', label: 'Mark Complete', icon: CheckCircle, variant: 'default' as const },
          { action: 'cancelled', label: 'Cancel', icon: AlertCircle, variant: 'destructive' as const }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active services at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBooking === booking.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedBooking(booking.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{booking.service?.name}</h4>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{booking.customer?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(booking.booking_date), 'MMM d, yyyy')} at {booking.booking_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.customer_address}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">₹{booking.total_amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.service?.duration_minutes} min
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Management Panel */}
      {selectedBookingData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Manage Service: {selectedBookingData.service?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <h5 className="font-medium mb-2">Customer Information</h5>
                <p className="text-sm">{selectedBookingData.customer?.full_name}</p>
                {selectedBookingData.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{selectedBookingData.customer.phone}</p>
                )}
              </div>
              <div>
                <h5 className="font-medium mb-2">Service Details</h5>
                <p className="text-sm">
                  {format(new Date(selectedBookingData.booking_date), 'MMMM d, yyyy')} at {selectedBookingData.booking_time}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {selectedBookingData.service?.duration_minutes} minutes
                </p>
              </div>
            </div>

            {/* Customer Notes */}
            {selectedBookingData.customer_notes && (
              <div>
                <Label className="text-sm font-medium">Customer Notes</Label>
                <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">{selectedBookingData.customer_notes}</p>
                </div>
              </div>
            )}

            {/* Provider Notes */}
            <div>
              <Label htmlFor="provider-notes" className="text-sm font-medium">
                Add Service Notes (Optional)
              </Label>
              <Textarea
                id="provider-notes"
                placeholder="Add any notes about the service, issues encountered, or additional work done..."
                value={providerNotes}
                onChange={(e) => setProviderNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {getNextActions(selectedBookingData.status).map(({ action, label, icon: Icon, variant }) => (
                <Button
                  key={action}
                  variant={variant}
                  onClick={() => handleStatusUpdate(action)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Status Timeline */}
            <div className="pt-4 border-t">
              <h5 className="font-medium mb-3">Service Timeline</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Booking confirmed</span>
                  <span className="text-muted-foreground ml-auto">
                    {format(new Date(selectedBookingData.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                {selectedBookingData.status === 'in_progress' && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Service in progress</span>
                    <span className="text-muted-foreground ml-auto">Now</span>
                  </div>
                )}
                
                {selectedBookingData.status === 'completed' && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Service completed</span>
                    <span className="text-muted-foreground ml-auto">
                      {format(new Date(selectedBookingData.updated_at || selectedBookingData.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};