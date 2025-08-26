import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewReminders } from "@/hooks/useReviews";
import { shouldSendReviewReminder } from "@/lib/ratingUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  customer_id: string;
  status: string;
  updated_at: string;
  service: {
    name: string;
  };
  provider: {
    full_name: string | null;
    business_name: string | null;
  };
}

const ReviewReminderSystem = () => {
  const { profile } = useAuth();
  const { sendReminder } = useReviewReminders();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile?.id) return;

    const checkAndSendReminders = async () => {
      try {
        // Get completed bookings without reviews
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            customer_id,
            status,
            updated_at,
            service:services(name),
            provider:profiles!provider_id(full_name, business_name)
          `)
          .eq('customer_id', profile.id)
          .eq('status', 'completed')
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

        if (bookingsError) throw bookingsError;

        if (!bookings || bookings.length === 0) return;

        // Check which bookings don't have reviews
        const bookingIds = bookings.map(b => b.id);
        const { data: existingReviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('booking_id')
          .in('booking_id', bookingIds);

        if (reviewsError) throw reviewsError;

        const reviewedBookingIds = new Set(existingReviews?.map(r => r.booking_id) || []);
        const unreviewed = bookings.filter(b => !reviewedBookingIds.has(b.id));

        // Check reminder history
        const { data: reminderHistory, error: reminderError } = await supabase
          .from('review_reminders')
          .select('booking_id, reminder_sent_at')
          .in('booking_id', unreviewed.map(b => b.id))
          .order('reminder_sent_at', { ascending: false });

        if (reminderError) throw reminderError;

        // Group reminders by booking_id
        const reminderMap = new Map();
        reminderHistory?.forEach(reminder => {
          if (!reminderMap.has(reminder.booking_id)) {
            reminderMap.set(reminder.booking_id, new Date(reminder.reminder_sent_at));
          }
        });

        // Send reminders for eligible bookings
        for (const booking of unreviewed) {
          const completedAt = new Date(booking.updated_at);
          const lastReminderSent = reminderMap.get(booking.id);
          
          if (shouldSendReviewReminder(completedAt, lastReminderSent)) {
            const result = await sendReminder(booking.id, booking.customer_id);
            
            if (result.success) {
              const providerName = booking.provider.business_name || booking.provider.full_name || 'Provider';
              
              // Show a gentle reminder notification
              toast({
                title: "Review Reminder",
                description: `Don't forget to review your recent service "${booking.service.name}" with ${providerName}`,
                duration: 8000,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in review reminder system:', error);
      }
    };

    // Check for reminders on component mount
    checkAndSendReminders();

    // Set up periodic checking (every hour)
    const interval = setInterval(checkAndSendReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile?.id, sendReminder, toast]);

  // This component doesn't render anything visible
  return null;
};

export default ReviewReminderSystem;