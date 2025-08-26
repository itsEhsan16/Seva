-- Add provider response functionality to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS provider_response TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS provider_response_date TIMESTAMP WITH TIME ZONE;

-- Add review reminder functionality
CREATE TABLE IF NOT EXISTS public.review_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reminder_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for review_reminders
ALTER TABLE public.review_reminders ENABLE ROW LEVEL SECURITY;

-- Create policy for review_reminders
CREATE POLICY "Users can view their own review reminders" ON public.review_reminders
  FOR SELECT USING (customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_review_reminders_booking_id ON public.review_reminders(booking_id);

-- Update RLS policies for reviews to allow provider responses
CREATE POLICY "Providers can update their review responses" ON public.reviews
  FOR UPDATE USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));