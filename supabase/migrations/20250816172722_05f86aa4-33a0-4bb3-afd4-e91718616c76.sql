-- Create storage buckets for service images and provider documents
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-documents', 'provider-documents', false);

-- Create policies for service images (public access)
CREATE POLICY "Service images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

CREATE POLICY "Providers can upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Providers can update their service images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Providers can delete their service images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Create policies for provider documents (private access)
CREATE POLICY "Providers can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'provider-documents' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Providers can upload their documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'provider-documents' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Add provider verification fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_license TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_documents TEXT[];

-- Create a view for provider statistics
CREATE OR REPLACE VIEW provider_stats AS
SELECT 
  p.id,
  p.user_id,
  COUNT(DISTINCT s.id) as total_services,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_earnings,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(DISTINCT r.id) as total_reviews
FROM profiles p
LEFT JOIN services s ON s.provider_id = p.id AND s.is_active = true
LEFT JOIN bookings b ON b.provider_id = p.id
LEFT JOIN reviews r ON r.provider_id = p.id AND r.is_approved = true
WHERE p.role = 'provider'
GROUP BY p.id, p.user_id;

-- Enable RLS on the view
ALTER VIEW provider_stats SET (security_invoker = on);