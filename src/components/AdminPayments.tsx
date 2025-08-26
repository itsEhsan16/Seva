import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, TrendingUp, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  successfulPayments: number;
  thisMonthRevenue: number;
  platformFees: number;
}

interface PaymentTransaction {
  id: string;
  booking_date: string;
  total_amount: number;
  payment_status: string;
  payment_id: string;
  created_at: string;
  service: {
    name: string;
  };
  customer: {
    full_name: string;
    phone: string;
  };
  provider: {
    full_name: string;
  };
}

export default function AdminPayments() {
  const { isAuthorized: isAdmin, isLoading: authLoading } = useAdminGuard();
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    failedPayments: 0,
    successfulPayments: 0,
    thisMonthRevenue: 0,
    platformFees: 0
  });
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchPaymentData();
    }
  }, [isAdmin]);

  const fetchPaymentData = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          customer:profiles!bookings_customer_id_fkey(full_name, phone),
          provider:profiles!bookings_provider_id_fkey(full_name)
        `)
        .neq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment data:', error);
        toast({
          title: "Error",
          description: "Failed to load payment data.",
          variant: "destructive",
        });
        return;
      }

      const allTransactions = data || [];
      const paidTransactions = allTransactions.filter(t => t.payment_status === 'paid');
      const failedTransactions = allTransactions.filter(t => t.payment_status === 'failed');

      // Calculate stats
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      const platformFees = totalRevenue * 0.15; // 15% platform fee

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthRevenue = paidTransactions
        .filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.total_amount, 0);

      setStats({
        totalRevenue,
        pendingPayments: allTransactions.filter(t => t.payment_status === 'pending').length,
        failedPayments: failedTransactions.length,
        successfulPayments: paidTransactions.length,
        thisMonthRevenue,
        platformFees
      });

      setTransactions(allTransactions);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Payment Management</h1>
        </div>
        <Button onClick={fetchPaymentData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Platform Fees: ₹{stats.platformFees.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-muted-foreground">This Month</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">₹{stats.thisMonthRevenue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">{stats.successfulPayments} successful payments</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="text-sm font-medium text-muted-foreground">Failed Payments</div>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
            <div className="text-sm text-muted-foreground">Requires attention</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service, customer, provider, or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "No transactions match your current filters."
                      : "No payment transactions available."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{transaction.service.name}</h3>
                          <Badge className={getStatusColor(transaction.payment_status)}>
                            {transaction.payment_status.charAt(0).toUpperCase() + transaction.payment_status.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>Customer: {transaction.customer.full_name}</div>
                          <div>Provider: {transaction.provider.full_name}</div>
                          <div>Booking Date: {new Date(transaction.booking_date).toLocaleDateString()}</div>
                          <div>Payment ID: {transaction.payment_id || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">₹{transaction.total_amount}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                        {transaction.payment_status === 'paid' && (
                          <div className="text-sm text-green-600">
                            Platform Fee: ₹{(transaction.total_amount * 0.15).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Successful Payments</span>
                    <span className="font-semibold">{stats.successfulPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Payments</span>
                    <span className="font-semibold text-red-600">{stats.failedPayments}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Success Rate</span>
                    <span className="font-semibold">
                      {stats.successfulPayments + stats.failedPayments > 0
                        ? ((stats.successfulPayments / (stats.successfulPayments + stats.failedPayments)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Revenue</span>
                    <span className="font-semibold">₹{stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fees (15%)</span>
                    <span className="font-semibold text-green-600">₹{stats.platformFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider Payouts (85%)</span>
                    <span className="font-semibold">₹{(stats.totalRevenue - stats.platformFees).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}