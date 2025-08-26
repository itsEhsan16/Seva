import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Star,
  MapPin,
  Clock,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlatformMetrics {
  totalUsers: number;
  totalProviders: number;
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
  topCategories: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  topProviders: Array<{
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
  monthlyStats: Array<{
    month: string;
    users: number;
    bookings: number;
    revenue: number;
  }>;
  geographicData: Array<{
    city: string;
    users: number;
    providers: number;
    bookings: number;
  }>;
}

const AdminAnalytics = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    completionRate: 0,
    userGrowthRate: 0,
    revenueGrowthRate: 0,
    topCategories: [],
    topProviders: [],
    monthlyStats: [],
    geographicData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch all required data
      const [
        usersQuery,
        bookingsQuery,
        reviewsQuery,
        servicesQuery,
        categoriesQuery
      ] = await Promise.all([
        supabase.from('profiles').select('role, city, created_at').neq('role', 'admin'),
        supabase.from('bookings').select(`
          *,
          service:services(name, category_id),
          provider:profiles!provider_id(full_name, business_name)
        `).gte('created_at', startDate.toISOString()),
        supabase.from('reviews').select('rating, created_at'),
        supabase.from('services').select('*, service_categories(name)'),
        supabase.from('service_categories').select('*')
      ]);

      if (usersQuery.error) throw usersQuery.error;
      if (bookingsQuery.error) throw bookingsQuery.error;
      if (reviewsQuery.error) throw reviewsQuery.error;

      const users = usersQuery.data || [];
      const bookings = bookingsQuery.data || [];
      const reviews = reviewsQuery.data || [];
      const services = servicesQuery.data || [];
      const categories = categoriesQuery.data || [];

      // Calculate metrics
      const totalUsers = users.length;
      const totalProviders = users.filter(u => u.role === 'provider').length;
      const totalCustomers = users.filter(u => u.role === 'customer').length;
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0);
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      const completionRate = totalBookings > 0 
        ? (completedBookings.length / totalBookings) * 100 
        : 0;

      // Calculate growth rates (comparing with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setTime(previousStartDate.getTime() - (endDate.getTime() - startDate.getTime()));
      
      const [prevUsersQuery, prevBookingsQuery] = await Promise.all([
        supabase.from('profiles').select('created_at')
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        supabase.from('bookings').select('total_amount, status')
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', startDate.toISOString())
      ]);

      const prevUsers = prevUsersQuery.data || [];
      const prevBookings = prevBookingsQuery.data || [];
      const prevRevenue = prevBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0);

      const userGrowthRate = prevUsers.length > 0 
        ? ((totalUsers - prevUsers.length) / prevUsers.length) * 100 
        : 0;
      const revenueGrowthRate = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;

      // Top categories by bookings and revenue
      const categoryStats = categories.map(cat => {
        const categoryBookings = bookings.filter(b => 
          b.service?.category_id === cat.id
        );
        const categoryRevenue = categoryBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0);
        
        return {
          name: cat.name,
          bookings: categoryBookings.length,
          revenue: categoryRevenue
        };
      }).sort((a, b) => b.bookings - a.bookings).slice(0, 5);

      // Top providers by bookings and revenue
      const providerStats = new Map();
      bookings.forEach(booking => {
        const providerId = booking.provider_id;
        const providerName = booking.provider?.business_name || booking.provider?.full_name || 'Unknown';
        
        if (!providerStats.has(providerId)) {
          providerStats.set(providerId, {
            name: providerName,
            bookings: 0,
            revenue: 0,
            totalRating: 0,
            ratingCount: 0
          });
        }
        
        const stats = providerStats.get(providerId);
        stats.bookings++;
        if (booking.status === 'completed') {
          stats.revenue += parseFloat(booking.total_amount.toString());
        }
      });

      // Add ratings to provider stats
      const providerReviews = await supabase
        .from('reviews')
        .select('provider_id, rating');
      
      if (providerReviews.data) {
        providerReviews.data.forEach(review => {
          if (providerStats.has(review.provider_id)) {
            const stats = providerStats.get(review.provider_id);
            stats.totalRating += review.rating;
            stats.ratingCount++;
          }
        });
      }

      const topProviders = Array.from(providerStats.values())
        .map(stats => ({
          ...stats,
          rating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Monthly stats for the last 6 months
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthUsers = users.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= monthStart && createdAt < monthEnd;
        }).length;
        
        const monthBookings = bookings.filter(b => {
          const createdAt = new Date(b.created_at);
          return createdAt >= monthStart && createdAt < monthEnd;
        });
        
        const monthRevenue = monthBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0);
        
        monthlyStats.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: monthUsers,
          bookings: monthBookings.length,
          revenue: monthRevenue
        });
      }

      // Geographic data
      const cityStats = new Map();
      users.forEach(user => {
        if (user.city) {
          if (!cityStats.has(user.city)) {
            cityStats.set(user.city, {
              city: user.city,
              users: 0,
              providers: 0,
              bookings: 0
            });
          }
          const stats = cityStats.get(user.city);
          stats.users++;
          if (user.role === 'provider') {
            stats.providers++;
          }
        }
      });

      bookings.forEach(booking => {
        // Extract city from customer address (simplified)
        const addressParts = booking.customer_address?.split(',') || [];
        const city = addressParts[addressParts.length - 2]?.trim();
        if (city && cityStats.has(city)) {
          cityStats.get(city).bookings++;
        }
      });

      const geographicData = Array.from(cityStats.values())
        .sort((a, b) => b.users - a.users)
        .slice(0, 10);

      setMetrics({
        totalUsers,
        totalProviders,
        totalCustomers,
        totalBookings,
        totalRevenue,
        averageRating,
        completionRate,
        userGrowthRate,
        revenueGrowthRate,
        topCategories: categoryStats,
        topProviders,
        monthlyStats,
        geographicData
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      metrics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `platform-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Analytics report exported successfully"
    });
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
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className={`w-4 h-4 ${metrics.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={metrics.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {metrics.userGrowthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{metrics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className={`w-4 h-4 ${metrics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={metrics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {metrics.revenueGrowthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{metrics.totalBookings}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.completionRate.toFixed(1)}% completion rate
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= metrics.averageRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Star className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Service Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.topCategories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{category.bookings} bookings</p>
                        <p className="text-sm text-muted-foreground">₹{category.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.topProviders.map((provider, index) => (
                    <div key={provider.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">
                              {provider.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{provider.bookings} bookings</p>
                        <p className="text-sm text-muted-foreground">₹{provider.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Customers</span>
                    <span className="font-semibold">{metrics.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Providers</span>
                    <span className="font-semibold">{metrics.totalProviders}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Provider Ratio</span>
                    <span className="font-semibold">
                      {metrics.totalUsers > 0 
                        ? ((metrics.totalProviders / metrics.totalUsers) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Bookings</span>
                    <span className="font-semibold">{metrics.totalBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-semibold">{metrics.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Avg. Booking Value</span>
                    <span className="font-semibold">
                      ₹{metrics.totalBookings > 0 
                        ? (metrics.totalRevenue / metrics.totalBookings).toFixed(0)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Rating</span>
                    <span className="font-semibold">{metrics.averageRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Growth</span>
                    <span className={`font-semibold ${metrics.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.userGrowthRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Revenue Growth</span>
                    <span className={`font-semibold ${metrics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.revenueGrowthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.geographicData.map((location, index) => (
                  <div key={location.city} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{location.city}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.providers} providers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{location.users} users</p>
                      <p className="text-sm text-muted-foreground">{location.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Monthly Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.monthlyStats.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="font-medium">{month.month}</div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{month.users}</p>
                        <p className="text-muted-foreground">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{month.bookings}</p>
                        <p className="text-muted-foreground">Bookings</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">₹{month.revenue.toLocaleString()}</p>
                        <p className="text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;