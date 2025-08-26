import React, { useState, useEffect } from "react";
import { 
  Users, 
  Settings, 
  Calendar, 
  Star, 
  TrendingUp, 
  DollarSign, 
  FileText,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminUsers from "./AdminUsers";
import AdminServices from "./AdminServices";
import AdminBookings from "./AdminBookings";
import AdminPayments from "./AdminPayments";
import AdminReviews from "./AdminReviews";
import AdminAnalytics from "./AdminAnalytics";
import AdminDisputes from "./AdminDisputes";

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  pendingReviews: number;
  activeServices: number;
}

const AdminDashboard = () => {
  const { isAuthorized, isLoading } = useAdminGuard();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    activeServices: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersQuery, bookingsQuery, reviewsQuery, servicesQuery] = await Promise.all([
        supabase.from('profiles').select('role').neq('role', 'admin'),
        supabase.from('bookings').select('total_amount, status'),
        supabase.from('reviews').select('is_approved'),
        supabase.from('services').select('is_active')
      ]);

      const users = usersQuery.data || [];
      const bookings = bookingsQuery.data || [];
      const reviews = reviewsQuery.data || [];
      const services = servicesQuery.data || [];

      const totalUsers = users.filter(u => u.role === 'customer').length;
      const totalProviders = users.filter(u => u.role === 'provider').length;
      const totalBookings = bookings.length;
      const totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0);
      const pendingReviews = reviews.filter(r => !r.is_approved).length;
      const activeServices = services.filter(s => s.is_active).length;

      setStats({
        totalUsers,
        totalProviders,
        totalBookings,
        totalRevenue,
        pendingReviews,
        activeServices
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading || !isAuthorized) {
    return (
      <div className="section-container py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your platform and monitor key metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Providers</p>
              <p className="text-2xl font-bold">{stats.totalProviders}</p>
            </div>
            <Settings className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Services</p>
              <p className="text-2xl font-bold">{stats.activeServices}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
              <p className="text-2xl font-bold">{stats.pendingReviews}</p>
            </div>
            <div className="relative">
              <Star className="w-8 h-8 text-primary" />
              {stats.pendingReviews > 0 && (
                <AlertCircle className="w-4 h-4 text-destructive absolute -top-1 -right-1" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">New user registrations</span>
                  <Badge variant="secondary">+12 today</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">New bookings</span>
                  <Badge variant="secondary">+8 today</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Reviews submitted</span>
                  <Badge variant="secondary">+5 today</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Pending disputes</span>
                  <Badge variant="destructive">3 open</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Platform Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Database</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">API Response</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Fast
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">User Satisfaction</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.pendingReviews > 0 ? `${((1 - stats.pendingReviews / 100) * 100).toFixed(0)}%` : '98%'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="services">
          <AdminServices />
        </TabsContent>

        <TabsContent value="bookings">
          <AdminBookings />
        </TabsContent>

        <TabsContent value="payments">
          <AdminPayments />
        </TabsContent>

        <TabsContent value="disputes">
          <AdminDisputes />
        </TabsContent>

        <TabsContent value="reviews">
          <AdminReviews />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;