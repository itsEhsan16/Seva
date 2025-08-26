import React, { useState, useEffect } from "react";
import { Plus, Calendar, DollarSign, Star, Clock, Edit, Trash2, CheckCircle, XCircle, UserCheck, Bell, TrendingUp, Users, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProviderServices } from "@/hooks/useProviderServices";
import { useProviderBookings } from "@/hooks/useProviderBookings";
import { useProviderStats } from "@/hooks/useProviderStats";
import { useProviderNotifications } from "@/hooks/useProviderNotifications";
import { ProviderRegistration } from "./ProviderRegistration";
import { ServiceForm } from "./ServiceForm";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import ReviewsList from "./ReviewsList";
import ProviderPayouts from "./ProviderPayouts";
import { ProviderAnalytics } from "./ProviderAnalytics";
import { ServiceStatusManager } from "./ServiceStatusManager";

const ProviderDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'reviews' | 'calendar' | 'payouts' | 'analytics' | 'service-status'>('overview');
  const [showRegistration, setShowRegistration] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Use real hooks for data
  const { services, loading: servicesLoading, deleteService } = useProviderServices();
  const { bookings, loading: bookingsLoading, updateBookingStatus } = useProviderBookings();
  const { stats, loading: statsLoading } = useProviderStats();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useProviderNotifications();

  const handleServiceFormSuccess = () => {
    setShowServiceForm(false);
    setEditingService(null);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    const { error } = await deleteService(serviceId);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Service Deleted",
        description: "Your service has been successfully deleted.",
      });
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline') => {
    const status = action === 'accept' ? 'confirmed' : 'cancelled';
    const { error } = await updateBookingStatus(bookingId, status);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Booking ${action === 'accept' ? 'Accepted' : 'Declined'}`,
        description: `The booking has been ${action === 'accept' ? 'accepted' : 'declined'}.`,
      });
    }
  };

  // Check if user needs to register as provider
  if (profile?.role !== 'provider') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <UserCheck className="w-16 h-16 text-primary mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Become a Service Provider</h1>
            <p className="text-muted-foreground mb-6">
              Join our platform as a service provider to start offering your services to customers.
            </p>
            <Button onClick={() => setShowRegistration(true)} size="lg">
              Apply to Become Provider
            </Button>
          </div>
        </div>
        <ProviderRegistration
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSuccess={() => {
            setShowRegistration(false);
            refreshProfile();
          }}
        />
      </div>
    );
  }

  // Show verification pending message
  if (profile?.verification_status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <Clock className="w-16 h-16 text-primary mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Application Under Review</h1>
            <p className="text-muted-foreground">
              Your provider application is being reviewed. You'll receive an email once approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="section-container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Provider Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.full_name || 'Provider'}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-medium">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No notifications</p>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                className="flex items-center gap-2"
                onClick={() => setShowServiceForm(true)}
              >
                <Plus className="w-4 h-4" />
                Add New Service
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <div className="section-container">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'services', label: 'Services' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'service-status', label: 'Service Status' },
              { id: 'payouts', label: 'Payouts' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'calendar', label: 'Calendar' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_bookings}</div>
                    <p className="text-xs text-muted-foreground">All time bookings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.monthly_earnings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">This month's earnings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Based on {stats.total_reviews} reviews</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_services}</div>
                    <p className="text-xs text-muted-foreground">Services available</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bookings yet.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{booking.service?.name}</h4>
                          <p className="text-sm text-muted-foreground">Customer: {booking.customer?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.booking_date} at {booking.booking_time}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-foreground">₹{booking.total_amount}</p>
                            <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Services</h2>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setShowServiceForm(true)}
              >
                <Plus className="w-4 h-4" />
                Add New Service
              </Button>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">No services yet</h3>
                  <p className="text-muted-foreground mb-4">Start by adding your first service to attract customers.</p>
                  <Button onClick={() => setShowServiceForm(true)}>Add Your First Service</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-6">
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={service.image_url || "/placeholder.svg"} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-2">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {service.description || "Professional service"}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-primary">₹{service.price}</span>
                        <span className="text-sm text-muted-foreground">
                          {service.duration_minutes ? `${service.duration_minutes} min` : "1 hour"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">{service.total_bookings || 0}</span>
                          <p>Bookings</p>
                        </div>
                        <div>
                          <span className="font-medium">₹{service.total_earnings || 0}</span>
                          <p>Earned</p>
                        </div>
                        <div>
                          <span className="font-medium">{(service.average_rating || 0).toFixed(1)}</span>
                          <p>Rating</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">All Bookings</h2>
            
            <Card>
              <CardContent className="p-6">
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bookings yet.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{booking.service?.name}</h4>
                          <p className="text-sm text-muted-foreground">Customer: {booking.customer?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.booking_date} at {booking.booking_time}</p>
                          <p className="text-sm text-muted-foreground">Address: {booking.customer_address}</p>
                          {booking.customer_notes && (
                            <p className="text-sm text-muted-foreground italic">Note: {booking.customer_notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-foreground">₹{booking.total_amount}</p>
                            <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}>
                              {booking.status}
                            </Badge>
                          </div>
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBookingAction(booking.id, 'accept')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBookingAction(booking.id, 'decline')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <ProviderPayouts />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Customer Reviews</h2>
            
            <div className="glass-card p-6">
              <ReviewsList providerId={profile?.id || ''} />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Analytics & Performance</h2>
            <ProviderAnalytics />
          </div>
        )}

        {activeTab === 'service-status' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Service Status Management</h2>
            <ServiceStatusManager />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Calendar & Availability</h2>
            <AvailabilityCalendar />
          </div>
        )}
      </div>

      {/* Modals */}
      <ServiceForm
        service={editingService}
        isOpen={showServiceForm}
        onClose={() => {
          setShowServiceForm(false);
          setEditingService(null);
        }}
        onSuccess={handleServiceFormSuccess}
      />
    </div>
  );
};

export default ProviderDashboard;