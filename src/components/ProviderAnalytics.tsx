import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, DollarSign, Star, Clock } from "lucide-react";
import { useProviderStats } from "@/hooks/useProviderStats";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs ${
          changeType === 'positive' ? 'text-green-600' : 
          changeType === 'negative' ? 'text-red-600' : 
          'text-muted-foreground'
        }`}>
          {change}
        </p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

export const ProviderAnalytics: React.FC = () => {
  const { stats, loading } = useProviderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completionRate = stats.total_bookings > 0 
    ? ((stats.completed_bookings / stats.total_bookings) * 100).toFixed(1)
    : '0';

  const averageBookingValue = stats.completed_bookings > 0
    ? (stats.total_earnings / stats.completed_bookings).toFixed(0)
    : '0';

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Monthly Revenue"
          value={`₹${stats.monthly_earnings.toLocaleString()}`}
          change="+12% from last month"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Current month earnings"
        />

        <AnalyticsCard
          title="Monthly Bookings"
          value={stats.monthly_bookings}
          change="+8% from last month"
          changeType="positive"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Bookings this month"
        />

        <AnalyticsCard
          title="Completion Rate"
          value={`${completionRate}%`}
          change={completionRate > '85' ? 'Excellent' : completionRate > '70' ? 'Good' : 'Needs improvement'}
          changeType={completionRate > '85' ? 'positive' : completionRate > '70' ? 'neutral' : 'negative'}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Completed vs total bookings"
        />

        <AnalyticsCard
          title="Customer Rating"
          value={stats.average_rating.toFixed(1)}
          change={`Based on ${stats.total_reviews} reviews`}
          changeType={stats.average_rating >= 4.5 ? 'positive' : stats.average_rating >= 3.5 ? 'neutral' : 'negative'}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          description="Average customer rating"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Business Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Services</span>
              <span className="font-medium">{stats.total_services}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <span className="font-medium">{stats.total_bookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed Services</span>
              <span className="font-medium">{stats.completed_bookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Booking Value</span>
              <span className="font-medium">₹{averageBookingValue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Lifetime Earnings</span>
              <span className="font-medium">₹{stats.total_earnings.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span>{completionRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer Satisfaction</span>
                <span>{((stats.average_rating / 5) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(stats.average_rating / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {stats.average_rating >= 4.5 
                  ? "Excellent performance! Keep up the great work."
                  : stats.average_rating >= 3.5 
                  ? "Good performance. Consider improving service quality."
                  : "Performance needs improvement. Focus on customer satisfaction."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};