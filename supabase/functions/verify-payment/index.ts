import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  sessionId: string;
  bookingId: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment verification started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create service client for database operations (bypass RLS)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { sessionId, bookingId }: VerifyPaymentRequest = await req.json();
    logStep("Verification request received", { sessionId, bookingId });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      sessionId, 
      paymentStatus: session.payment_status,
      status: session.status 
    });

    // Determine payment status
    let paymentStatus = 'pending';
    let bookingStatus = 'pending';

    if (session.payment_status === 'paid' && session.status === 'complete') {
      paymentStatus = 'paid';
      bookingStatus = 'confirmed';
      logStep("Payment successful");
    } else if (session.payment_status === 'unpaid' || session.status === 'expired') {
      paymentStatus = 'failed';
      bookingStatus = 'cancelled';
      logStep("Payment failed or expired");
    }

    // Update booking with payment status
    const { error: updateError } = await supabaseService
      .from('bookings')
      .update({
        payment_status: paymentStatus,
        status: bookingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('payment_id', sessionId); // Additional security check

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    logStep("Booking updated successfully", { 
      bookingId, 
      paymentStatus, 
      bookingStatus 
    });

    // Fetch updated booking details
    const { data: bookingData, error: fetchError } = await supabaseService
      .from('bookings')
      .select('*, service:services(name), profiles!bookings_customer_id_fkey(full_name, phone)')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      logStep("Warning: Could not fetch updated booking details", { error: fetchError });
    }

    return new Response(JSON.stringify({
      success: paymentStatus === 'paid',
      paymentStatus,
      bookingStatus,
      sessionStatus: session.status,
      booking: bookingData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});