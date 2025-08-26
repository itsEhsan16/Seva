import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase first
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

import { notificationService } from '@/lib/notificationService';

const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  channel: vi.fn(),
};

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Get fresh reference to mocked supabase
    const { supabase } = require('@/integrations/supabase/client');
    Object.assign(mockSupabase, supabase);
  });

  describe('sendNotification', () => {
    it('sends notification successfully', async () => {
      const mockNotificationId = 'notif-123';
      mockSupabase.rpc.mockResolvedValue({
        data: mockNotificationId,
        error: null,
      });

      const result = await notificationService.sendNotification(
        'user-123',
        'booking_confirmed',
        'Booking Confirmed',
        'Your booking has been confirmed',
        { booking_id: 'booking-123' },
        'normal'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'user-123',
        p_type: 'booking_confirmed',
        p_title: 'Booking Confirmed',
        p_message: 'Your booking has been confirmed',
        p_data: { booking_id: 'booking-123' },
        p_priority: 'normal',
      });

      expect(result).toBe(mockNotificationId);
    });

    it('handles notification sending error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await notificationService.sendNotification(
        'user-123',
        'booking_confirmed',
        'Booking Confirmed',
        'Your booking has been confirmed'
      );

      expect(result).toBeNull();
    });
  });

  describe('sendBookingStatusNotification', () => {
    it('sends notifications for booking confirmation', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'notif-123',
        error: null,
      });

      await notificationService.sendBookingStatusNotification(
        'booking-123',
        'customer-123',
        'provider-123',
        'confirmed',
        {
          service_name: 'House Cleaning',
          provider_name: 'John Doe',
          booking_date: '2024-01-15',
          booking_time: '10:00 AM',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
      
      // Check customer notification
      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'customer-123',
        p_type: 'booking_confirmed',
        p_title: 'Booking Confirmed',
        p_message: 'Your House Cleaning booking with John Doe on 1/15/2024 at 10:00 AM has been confirmed.',
        p_data: expect.objectContaining({ booking_id: 'booking-123' }),
        p_priority: 'normal',
      });

      // Check provider notification
      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'provider-123',
        p_type: 'booking_created',
        p_title: 'New Booking Received',
        p_message: 'You have a new House Cleaning booking on 1/15/2024 at 10:00 AM.',
        p_data: expect.objectContaining({ booking_id: 'booking-123' }),
        p_priority: 'high',
      });
    });

    it('sends notifications for booking cancellation', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'notif-123',
        error: null,
      });

      await notificationService.sendBookingStatusNotification(
        'booking-123',
        'customer-123',
        'provider-123',
        'cancelled',
        {
          service_name: 'House Cleaning',
          booking_date: '2024-01-15',
          booking_time: '10:00 AM',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
      
      // Both should receive cancellation notifications
      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', 
        expect.objectContaining({
          p_type: 'booking_cancelled',
          p_title: 'Booking Cancelled',
        })
      );
    });
  });

  describe('sendPaymentNotification', () => {
    it('sends payment success notifications', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'notif-123',
        error: null,
      });

      await notificationService.sendPaymentNotification(
        'customer-123',
        'provider-123',
        {
          booking_id: 'booking-123',
          amount: 500,
          payment_id: 'pay-123',
          status: 'success',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
      
      // Check customer notification
      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'customer-123',
        p_type: 'payment_received',
        p_title: 'Payment Confirmed',
        p_message: 'Your payment of ₹500 has been processed successfully.',
        p_data: expect.objectContaining({ 
          booking_id: 'booking-123',
          payment_id: 'pay-123',
          amount: 500,
        }),
        p_priority: 'normal',
      });

      // Check provider notification
      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'provider-123',
        p_type: 'payment_received',
        p_title: 'Payment Received',
        p_message: 'You have received a payment of ₹500 for your service.',
        p_data: expect.objectContaining({ 
          booking_id: 'booking-123',
          payment_id: 'pay-123',
          amount: 500,
        }),
        p_priority: 'normal',
      });
    });

    it('sends payment failure notification to customer only', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'notif-123',
        error: null,
      });

      await notificationService.sendPaymentNotification(
        'customer-123',
        'provider-123',
        {
          booking_id: 'booking-123',
          amount: 500,
          payment_id: 'pay-123',
          status: 'failed',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'customer-123',
        p_type: 'payment_failed',
        p_title: 'Payment Failed',
        p_message: 'Your payment of ₹500 could not be processed. Please try again.',
        p_data: expect.objectContaining({ 
          booking_id: 'booking-123',
          payment_id: 'pay-123',
          amount: 500,
        }),
        p_priority: 'high',
      });
    });
  });

  describe('updateProviderLocation', () => {
    it('updates provider location and notifies customer', async () => {
      const mockFrom = {
        upsert: vi.fn().mockReturnValue({
          error: null,
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { customer_id: 'customer-123' },
              error: null,
            }),
          }),
        }),
      };

      mockSupabase.from.mockReturnValue(mockFrom);
      mockSupabase.rpc.mockResolvedValue({
        data: 'notif-123',
        error: null,
      });

      await notificationService.updateProviderLocation(
        'provider-123',
        'booking-123',
        {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          estimated_arrival: '2024-01-15T10:30:00Z',
        }
      );

      expect(mockFrom.upsert).toHaveBeenCalledWith({
        provider_id: 'provider-123',
        booking_id: 'booking-123',
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10,
        estimated_arrival: '2024-01-15T10:30:00Z',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'customer-123',
        p_type: 'location_update',
        p_title: 'Provider Location Update',
        p_message: 'Your service provider is on the way. Estimated arrival: 4:00:00 PM',
        p_data: expect.objectContaining({
          booking_id: 'booking-123',
          provider_id: 'provider-123',
        }),
        p_priority: 'normal',
      });
    });
  });

  describe('sendArrivalNotification', () => {
    it('sends arrival notification to customer', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'notif-123',
        error: null,
      });

      await notificationService.sendArrivalNotification(
        'customer-123',
        'provider-123',
        'booking-123'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('send_notification', {
        p_user_id: 'customer-123',
        p_type: 'arrival_notification',
        p_title: 'Provider Arrived',
        p_message: 'Your service provider has arrived at your location.',
        p_data: {
          booking_id: 'booking-123',
          provider_id: 'provider-123',
        },
        p_priority: 'high',
      });
    });
  });

  describe('broadcastSystemAnnouncement', () => {
    it('broadcasts system announcement', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'announcement-123',
        error: null,
      });

      const result = await notificationService.broadcastSystemAnnouncement(
        'System Maintenance',
        'The system will be under maintenance from 2-4 AM',
        'maintenance',
        'all'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('broadcast_system_announcement', {
        p_title: 'System Maintenance',
        p_message: 'The system will be under maintenance from 2-4 AM',
        p_type: 'maintenance',
        p_target_audience: 'all',
      });

      expect(result).toBe('announcement-123');
    });
  });

  describe('subscribeToNotifications', () => {
    it('sets up real-time subscription', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const onNotification = vi.fn();
      const unsubscribe = notificationService.subscribeToNotifications(
        'user-123',
        onNotification
      );

      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications:user-123');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.user-123',
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscribeToLocationUpdates', () => {
    it('sets up location updates subscription', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const onLocationUpdate = vi.fn();
      const unsubscribe = notificationService.subscribeToLocationUpdates(
        'booking-123',
        onLocationUpdate
      );

      expect(mockSupabase.channel).toHaveBeenCalledWith('location:booking-123');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_locations',
          filter: 'booking_id=eq.booking-123',
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
  });
});