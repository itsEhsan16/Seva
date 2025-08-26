-- Create refunds table for tracking payment refunds
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  refund_id TEXT NOT NULL, -- Stripe refund ID
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'service_issue', 'provider_cancellation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Create policies for refunds
CREATE POLICY "Users can view refunds for their bookings" ON public.refunds
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.profiles p ON (b.customer_id = p.id OR b.provider_id = p.id)
      WHERE p.user_id = auth.uid()
    )
  );

-- Only admins can insert/update refunds (in real app, this would be done via server-side functions)
CREATE POLICY "Admins can manage refunds" ON public.refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for timestamp updates
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_refunds_booking_id ON public.refunds(booking_id);
CREATE INDEX idx_refunds_refund_id ON public.refunds(refund_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);