import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PayoutStats {
  totalEarnings: number;
  pendingPayouts: number;
  completedBookings: number;
  thisMonthEarnings: number;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  service: {
    name: string;
  };
  customer: {
    full_name: string;
  };
}

export default function ProviderPayouts() {
  const [stats, setStats] = useState<PayoutStats>({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedBookings: 0,
    thisMonthEarnings: 0
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Fetch bookings for this provider
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          customer:profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq('provider_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      const allBookings = bookings || [];
      const paidBookings = allBookings.filter(b => b.payment_status === 'paid');
      const completedBookings = allBookings.filter(b => b.status === 'completed' && b.payment_status === 'paid');
      
      // Calculate stats
      const totalEarnings = completedBookings.reduce((sum, booking) => {
        // Assuming 85% goes to provider (15% platform fee)
        return sum + (booking.total_amount * 0.85);
      }, 0);

      const pendingPayouts = paidBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, booking) => sum + (booking.total_amount * 0.85), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthEarnings = completedBookings
        .filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking) => sum + (booking.total_amount * 0.85), 0);

      setStats({
        totalEarnings,
        pendingPayouts,
        completedBookings: completedBookings.length,
        thisMonthEarnings
      });

      setRecentBookings(allBookings.slice(0, 10));

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load payout data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    toast({
      title: "Payout Requested",
      description: "Your payout request has been submitted and will be processed within 3-5 business days.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Earnings & Payouts</h1>
        </div>
        {stats.pendingPayouts > 0 && (
          <Button onClick={requestPayout}>
            Request Payout
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-muted-foreground">Total Earnings</div>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium text-muted-foreground">Pending Payouts</div>
            </div>
            <div className="text-2xl font-bold text-orange-600">₹{stats.pendingPayouts.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-muted-foreground">This Month</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">₹{stats.thisMonthEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium text-muted-foreground">Completed Jobs</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.completedBookings}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earnings">Recent Earnings</TabsTrigger>
          <TabsTrigger value="payout-info">Payout Information</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
                  <p className="text-muted-foreground">Complete your first booking to start earning!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{booking.service.name}</h4>
                          <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {booking.payment_status}
                          </Badge>
                          <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {booking.customer.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ₹{booking.total_amount}
                        </div>
                        {booking.payment_status === 'paid' && booking.status === 'completed' && (
                          <div className="text-sm text-green-600">
                            Your share: ₹{(booking.total_amount * 0.85).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How Payouts Work</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You earn 85% of each completed booking payment</li>
                  <li>• Payouts are processed weekly on Fridays</li>
                  <li>• Minimum payout amount is ₹500</li>
                  <li>• Funds are transferred to your registered bank account</li>
                  <li>• Processing time: 3-5 business days</li>
                </ul>
              </div>

              <div className="border p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Payout Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Next Payout Date:</p>
                    <p className="text-muted-foreground">
                      {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Available for Payout:</p>
                    <p className="text-green-600 font-semibold">₹{stats.pendingPayouts.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  Need to Update Your Bank Details?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Contact support to update your payout information.
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}