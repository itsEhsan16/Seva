import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  MapPin, 
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  FileText,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  customer_address: string;
  customer_notes: string | null;
  provider_notes: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string | null;
    phone: string | null;
  };
  provider: {
    id: string;
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [disputeNote, setDisputeNote] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(id, full_name, phone),
          provider:profiles!provider_id(id, full_name, business_name, phone),
          service:services(id, name, duration_minutes)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.provider.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`
      });
      
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status"
      });
    }
  };

  const addDisputeNote = async (bookingId: string) => {
    if (!disputeNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a dispute note"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          provider_notes: disputeNote,
          status: 'disputed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dispute note added successfully"
      });
      
      setDisputeNote("");
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error adding dispute note:', error);
      toast({
        title: "Error",
        description: "Failed to add dispute note"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Booking ID: {booking.id.slice(0, 8)}...
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                  {booking.payment_status}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong>Customer:</strong> {booking.customer.full_name || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong>Provider:</strong> {booking.provider.business_name || booking.provider.full_name || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{booking.service.duration_minutes} minutes</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>₹{booking.total_amount}</span>
                {booking.payment_method && (
                  <span className="text-muted-foreground">
                    via {booking.payment_method}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>{booking.customer_address}</span>
              </div>

              {booking.customer_notes && (
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>
                    <strong>Customer Notes:</strong> {booking.customer_notes}
                  </span>
                </div>
              )}

              {booking.provider_notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>
                    <strong>Provider Notes:</strong> {booking.provider_notes}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {booking.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}

              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Start Service
                </Button>
              )}

              {booking.status === 'in_progress' && (
                <Button
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </Button>
              )}

              {booking.status !== 'disputed' && booking.status !== 'cancelled' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setSelectedBooking(booking)}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Dispute
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Dispute Note</DialogTitle>
                      <DialogDescription>
                        Add a note explaining the dispute for booking {booking.id.slice(0, 8)}...
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Enter dispute details..."
                      value={disputeNote}
                      onChange={(e) => setDisputeNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDisputeNote("");
                          setSelectedBooking(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => addDisputeNote(booking.id)}>
                        Add Dispute
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;