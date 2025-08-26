-- Create notifications table for all user types
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed',
    'payment_received', 'payment_failed', 'payment_refunded',
    'review_received', 'provider_approved', 'provider_rejected',
    'system_maintenance', 'system_announcement',
    'location_update', 'arrival_notification'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data like booking_id, payment_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create provider notifications table (for backward compatibility)
CREATE TABLE public.provider_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_booking', 'booking_update', 'payment_received', 'review_received', 'system_message'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create location tracking table for provider location updates
CREATE TABLE public.provider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- GPS accuracy in meters
  heading DECIMAL(5, 2), -- Direction in degrees
  speed DECIMAL(8, 2), -- Speed in km/h
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(provider_id, booking_id)
);

-- Create system announcements table
CREATE TABLE public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'maintenance', 'feature')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'providers', 'admins')),
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create policies for provider notifications (backward compatibility)
CREATE POLICY "Providers can view their own notifications" ON public.provider_notifications
  FOR SELECT USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers can update their own notifications" ON public.provider_notifications
  FOR UPDATE USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create policies for provider locations
CREATE POLICY "Providers can manage their own location" ON public.provider_locations
  FOR ALL USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view location of their booked providers" ON public.provider_locations
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Create policies for system announcements
CREATE POLICY "Active announcements are viewable by everyone" ON public.system_announcements
  FOR SELECT USING (
    is_active = TRUE AND 
    starts_at <= now() AND 
    (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "Admins can manage announcements" ON public.system_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX idx_provider_notifications_provider_id ON public.provider_notifications(provider_id);
CREATE INDEX idx_provider_notifications_is_read ON public.provider_notifications(is_read);

CREATE INDEX idx_provider_locations_provider_id ON public.provider_locations(provider_id);
CREATE INDEX idx_provider_locations_booking_id ON public.provider_locations(booking_id);

CREATE INDEX idx_system_announcements_active ON public.system_announcements(is_active, starts_at, ends_at);

-- Create function to automatically mark notification as read when read_at is set
CREATE OR REPLACE FUNCTION public.update_notification_read_status()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.is_read = TRUE;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for notification read status
CREATE TRIGGER update_notification_read_status
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_notification_read_status();

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data, priority)
  VALUES (p_user_id, p_type, p_title, p_message, p_data, p_priority)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send provider notification (backward compatibility)
CREATE OR REPLACE FUNCTION public.send_provider_notification(
  p_provider_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.provider_notifications (provider_id, type, title, message, data)
  VALUES (p_provider_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to broadcast system announcement
CREATE OR REPLACE FUNCTION public.broadcast_system_announcement(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_target_audience TEXT DEFAULT 'all'
)
RETURNS UUID AS $
DECLARE
  announcement_id UUID;
  user_record RECORD;
BEGIN
  -- Create the announcement
  INSERT INTO public.system_announcements (title, message, type, target_audience)
  VALUES (p_title, p_message, p_type, p_target_audience)
  RETURNING id INTO announcement_id;
  
  -- Send notifications to target users
  FOR user_record IN 
    SELECT id FROM public.profiles 
    WHERE (p_target_audience = 'all' OR role = p_target_audience)
  LOOP
    PERFORM public.send_notification(
      user_record.id,
      'system_announcement',
      p_title,
      p_message,
      jsonb_build_object('announcement_id', announcement_id),
      'normal'
    );
  END LOOP;
  
  RETURN announcement_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;