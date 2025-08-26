import { supabase } from '@/integrations/supabase/client';
import { processRefund, type RefundRequest, type RefundResponse } from './stripe';
import { differenceInHours, parseISO } from 'date-fns';

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  refundAmount?: number;
  refundPercentage?: number;
}

export interface BookingRefundRequest {
  bookingId: string;
  reason: 'customer_request' | 'provider_cancellation' | 'service_issue' | 'duplicate';
  refundAmount?: number; // If partial refund
  adminOverride?: boolean;
}

/**
 * Check if a booking is eligible for refund based on cancellation policy
 */
export const checkRefundEligibility = async (bookingId: string): Promise<RefundEligibility> => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        total_amount,
        status,
        payment_status,
        created_at
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    if (!booking) {
      return { eligible: false, reason: 'Booking not found' };
    }

    if (booking.payment_status !== 'paid') {
      return { eligible: false, reason: 'Booking not paid' };
    }

    if (booking.status === 'completed') {
      return { eligible: false, reason: 'Service already completed' };
    }

    if (booking.status === 'cancelled') {
      return { eligible: false, reason: 'Booking already cancelled' };
    }

    // Calculate time until service
    const serviceDateTime = parseISO(`${booking.booking_date}T${booking.booking_time}`);
    const now = new Date();
    const hoursUntilService = differenceInHours(serviceDateTime, now);

    // Refund policy:
    // - More than 24 hours: 100% refund
    // - 12-24 hours: 75% refund
    // - 6-12 hours: 50% refund
    // - Less than 6 hours: 25% refund
    // - Service started: No refund

    if (hoursUntilService < 0) {
      return { eligible: false, reason: 'Service time has passed' };
    }

    let refundPercentage = 100;
    if (hoursUntilService < 24) {
      if (hoursUntilService >= 12) {
        refundPercentage = 75;
      } else if (hoursUntilService >= 6) {
        refundPercentage = 50;
      } else {
        refundPercentage = 25;
      }
    }

    const refundAmount = Math.round((booking.total_amount * refundPercentage) / 100);

    return {
      eligible: true,
      refundAmount,
      refundPercentage,
    };
  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Process a refund for a booking
 */
export const processBookingRefund = async (
  request: BookingRefundRequest
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
  try {
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        payment_id,
        total_amount,
        status,
        payment_status
      `)
      .eq('id', request.bookingId)
      .single();

    if (bookingError) throw bookingError;

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (!booking.payment_id) {
      return { success: false, error: 'No payment ID found for this booking' };
    }

    // Check eligibility unless admin override
    if (!request.adminOverride) {
      const eligibility = await checkRefundEligibility(request.bookingId);
      if (!eligibility.eligible) {
        return { success: false, error: eligibility.reason || 'Refund not eligible' };
      }
    }

    // Determine refund amount
    const refundAmount = request.refundAmount || booking.total_amount;

    // Process refund through Stripe
    const stripeRefundRequest: RefundRequest = {
      paymentIntentId: booking.payment_id,
      amount: refundAmount * 100, // Convert to cents
      reason: request.reason === 'customer_request' ? 'requested_by_customer' : 'duplicate',
      bookingId: request.bookingId,
    };

    const refundResponse = await processRefund(stripeRefundRequest);

    if (refundResponse.status === 'succeeded') {
      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.bookingId);

      if (updateError) {
        console.error('Error updating booking status after refund:', updateError);
        // Don't fail the refund if status update fails
      }

      // Create refund record
      const { error: refundRecordError } = await supabase
        .from('refunds')
        .insert({
          booking_id: request.bookingId,
          refund_id: refundResponse.refundId,
          amount: refundAmount,
          reason: request.reason,
          status: refundResponse.status,
          processed_at: new Date().toISOString(),
        });

      if (refundRecordError) {
        console.error('Error creating refund record:', refundRecordError);
      }

      return { success: true, refundId: refundResponse.refundId };
    } else {
      return { success: false, error: 'Refund processing failed' };
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Get refund history for a booking
 */
export const getBookingRefunds = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('booking_id', bookingId)
      .order('processed_at', { ascending: false });

    if (error) throw error;

    return { success: true, refunds: data || [] };
  } catch (error) {
    console.error('Error fetching refund history:', error);
    return { success: false, refunds: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Calculate refund amount based on cancellation policy
 */
export const calculateRefundAmount = (
  originalAmount: number,
  hoursUntilService: number,
  adminOverride: boolean = false
): { amount: number; percentage: number } => {
  if (adminOverride) {
    return { amount: originalAmount, percentage: 100 };
  }

  let percentage = 100;

  if (hoursUntilService < 0) {
    percentage = 0; // Service time has passed
  } else if (hoursUntilService < 6) {
    percentage = 25;
  } else if (hoursUntilService < 12) {
    percentage = 50;
  } else if (hoursUntilService < 24) {
    percentage = 75;
  }

  const amount = Math.round((originalAmount * percentage) / 100);
  return { amount, percentage };
};

/**
 * Send refund notification to customer
 */
export const sendRefundNotification = async (
  bookingId: string,
  refundAmount: number,
  refundId: string
) => {
  try {
    // In a real application, this would send an email/SMS notification
    // For now, we'll just log the notification
    console.log('Refund notification:', {
      bookingId,
      refundAmount,
      refundId,
      message: `Your refund of ₹${refundAmount} has been processed successfully. Refund ID: ${refundId}. The amount will be credited to your original payment method within 5-7 business days.`
    });

    // You could integrate with email service here
    // await emailService.sendRefundNotification(customerEmail, refundDetails);

    return { success: true };
  } catch (error) {
    console.error('Error sending refund notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};