import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export type NotificationType = 
  | 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed'
  | 'payment_received' | 'payment_failed' | 'payment_refunded'
  | 'review_received' | 'provider_approved' | 'provider_rejected'
  | 'system_maintenance' | 'system_announcement'
  | 'location_update' | 'arrival_notification';

export interface ProviderLocation {
  id: string;
  provider_id: string;
  booking_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  estimated_arrival?: string;
  created_at: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  target_audience: 'all' | 'customers' | 'providers' | 'admins';
  is_active: boolean;
  starts_at: string;
  ends_at?: string;
  created_by?: string;
  created_at: string;
}

class NotificationService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Send a notification to a specific user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {},
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string | null> {
    try {
      const { data: result, error } = await supabase.rpc('send_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data,
        p_priority: priority
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  /**
   * Send booking status change notifications
   */
  async sendBookingStatusNotification(
    bookingId: string,
    customerId: string,
    providerId: string,
    status: string,
    bookingData: any
  ): Promise<void> {
    const notifications = this.getBookingStatusNotifications(status, bookingData);
    
    // Send to customer
    if (notifications.customer) {
      await this.sendNotification(
        customerId,
        notifications.customer.type,
        notifications.customer.title,
        notifications.customer.message,
        { booking_id: bookingId, ...bookingData },
        notifications.customer.priority
      );
    }

    // Send to provider
    if (notifications.provider) {
      await this.sendNotification(
        providerId,
        notifications.provider.type,
        notifications.provider.title,
        notifications.provider.message,
        { booking_id: bookingId, ...bookingData },
        notifications.provider.priority
      );
    }
  }

  /**
   * Send payment confirmation notifications
   */
  async sendPaymentNotification(
    customerId: string,
    providerId: string,
    paymentData: {
      booking_id: string;
      amount: number;
      payment_id: string;
      status: 'success' | 'failed' | 'refunded';
    }
  ): Promise<void> {
    const { booking_id, amount, payment_id, status } = paymentData;

    if (status === 'success') {
      // Notify customer
      await this.sendNotification(
        customerId,
        'payment_received',
        'Payment Confirmed',
        `Your payment of ₹${amount} has been processed successfully.`,
        { booking_id, payment_id, amount },
        'normal'
      );

      // Notify provider
      await this.sendNotification(
        providerId,
        'payment_received',
        'Payment Received',
        `You have received a payment of ₹${amount} for your service.`,
        { booking_id, payment_id, amount },
        'normal'
      );
    } else if (status === 'failed') {
      // Notify customer only
      await this.sendNotification(
        customerId,
        'payment_failed',
        'Payment Failed',
        `Your payment of ₹${amount} could not be processed. Please try again.`,
        { booking_id, payment_id, amount },
        'high'
      );
    } else if (status === 'refunded') {
      // Notify customer
      await this.sendNotification(
        customerId,
        'payment_refunded',
        'Refund Processed',
        `Your refund of ₹${amount} has been processed and will appear in your account within 5-7 business days.`,
        { booking_id, payment_id, amount },
        'normal'
      );
    }
  }

  /**
   * Update provider location for tracking
   */
  async updateProviderLocation(
    providerId: string,
    bookingId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      estimated_arrival?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_locations')
        .upsert({
          provider_id: providerId,
          booking_id: bookingId,
          ...location
        });

      if (error) throw error;

      // Get customer ID for this booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('id', bookingId)
        .single();

      if (booking) {
        // Send location update notification to customer
        await this.sendNotification(
          booking.customer_id,
          'location_update',
          'Provider Location Update',
          location.estimated_arrival 
            ? `Your service provider is on the way. Estimated arrival: ${new Date(location.estimated_arrival).toLocaleTimeString()}`
            : 'Your service provider location has been updated.',
          { 
            booking_id: bookingId, 
            provider_id: providerId,
            location,
            estimated_arrival: location.estimated_arrival
          },
          'normal'
        );
      }
    } catch (error) {
      console.error('Error updating provider location:', error);
    }
  }

  /**
   * Send arrival notification
   */
  async sendArrivalNotification(
    customerId: string,
    providerId: string,
    bookingId: string
  ): Promise<void> {
    await this.sendNotification(
      customerId,
      'arrival_notification',
      'Provider Arrived',
      'Your service provider has arrived at your location.',
      { booking_id: bookingId, provider_id: providerId },
      'high'
    );
  }

  /**
   * Broadcast system announcement
   */
  async broadcastSystemAnnouncement(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'maintenance' | 'feature' = 'info',
    targetAudience: 'all' | 'customers' | 'providers' | 'admins' = 'all'
  ): Promise<string | null> {
    try {
      const { data: result, error } = await supabase.rpc('broadcast_system_announcement', {
        p_title: title,
        p_message: message,
        p_type: type,
        p_target_audience: targetAudience
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error broadcasting system announcement:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ): () => void {
    const channelName = `notifications:${userId}`;
    
    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to provider location updates for a booking
   */
  subscribeToLocationUpdates(
    bookingId: string,
    onLocationUpdate: (location: ProviderLocation) => void
  ): () => void {
    const channelName = `location:${bookingId}`;
    
    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_locations',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          if (payload.new) {
            onLocationUpdate(payload.new as ProviderLocation);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Get notification templates for booking status changes
   */
  private getBookingStatusNotifications(status: string, bookingData: any) {
    const serviceName = bookingData.service_name || 'service';
    const providerName = bookingData.provider_name || 'service provider';
    const bookingDate = bookingData.booking_date ? new Date(bookingData.booking_date).toLocaleDateString() : '';
    const bookingTime = bookingData.booking_time || '';

    switch (status) {
      case 'confirmed':
        return {
          customer: {
            type: 'booking_confirmed' as NotificationType,
            title: 'Booking Confirmed',
            message: `Your ${serviceName} booking with ${providerName} on ${bookingDate} at ${bookingTime} has been confirmed.`,
            priority: 'normal' as const
          },
          provider: {
            type: 'booking_created' as NotificationType,
            title: 'New Booking Received',
            message: `You have a new ${serviceName} booking on ${bookingDate} at ${bookingTime}.`,
            priority: 'high' as const
          }
        };

      case 'cancelled':
        return {
          customer: {
            type: 'booking_cancelled' as NotificationType,
            title: 'Booking Cancelled',
            message: `Your ${serviceName} booking on ${bookingDate} has been cancelled.`,
            priority: 'normal' as const
          },
          provider: {
            type: 'booking_cancelled' as NotificationType,
            title: 'Booking Cancelled',
            message: `The ${serviceName} booking on ${bookingDate} at ${bookingTime} has been cancelled.`,
            priority: 'normal' as const
          }
        };

      case 'completed':
        return {
          customer: {
            type: 'booking_completed' as NotificationType,
            title: 'Service Completed',
            message: `Your ${serviceName} has been completed. Please rate your experience.`,
            priority: 'normal' as const
          },
          provider: {
            type: 'booking_completed' as NotificationType,
            title: 'Service Completed',
            message: `You have successfully completed the ${serviceName} service.`,
            priority: 'normal' as const
          }
        };

      default:
        return {};
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

export const notificationService = new NotificationService();