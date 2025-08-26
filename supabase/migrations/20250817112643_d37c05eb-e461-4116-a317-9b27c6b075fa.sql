-- Seed data for service categories
UPDATE service_categories SET 
  description = 'Professional cleaning services for homes and offices',
  icon = 'CleaningServices',
  image_url = '/lovable-uploads/dc13e94f-beeb-4671-8a22-0968498cdb4c.png'
WHERE name = 'Home Cleaning';

UPDATE service_categories SET 
  description = 'Electrical installations, repairs, and maintenance',
  icon = 'Electrical',
  image_url = '/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png'
WHERE name = 'Electrical Services';

UPDATE service_categories SET 
  description = 'Plumbing repairs, installations, and maintenance',
  icon = 'Plumbing',
  image_url = '/lovable-uploads/5663820f-6c97-4492-9210-9eaa1a8dc415.png'
WHERE name = 'Plumbing';

UPDATE service_categories SET 
  description = 'Moving and relocation services',
  icon = 'Moving',
  image_url = '/lovable-uploads/22d31f51-c174-40a7-bd95-00e4ad00eaf3.png'
WHERE name = 'Packers & Movers';

UPDATE service_categories SET 
  description = 'AC installation, repair, and maintenance',
  icon = 'AirConditioner',
  image_url = '/lovable-uploads/c3d5522b-6886-4b75-8ffc-d020016bb9c2.png'
WHERE name = 'AC Services';

-- Insert provider profiles for seed data
INSERT INTO profiles (user_id, full_name, role, phone, address, city, state, pincode, business_name, experience_years, skills, verification_status, is_verified) VALUES
  (gen_random_uuid(), 'Rajesh Kumar', 'provider', '+91 9876543210', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'Clean Pro Services', 5, ARRAY['Deep Cleaning', 'Office Cleaning', 'Post Construction Cleaning'], 'verified', true),
  (gen_random_uuid(), 'Amit Sharma', 'provider', '+91 9876543211', '456 Park Street', 'Kolkata', 'West Bengal', '700016', 'ElectriCare', 8, ARRAY['Wiring', 'Panel Installation', 'Emergency Repairs'], 'verified', true),
  (gen_random_uuid(), 'Priya Patel', 'provider', '+91 9876543212', '789 Brigade Road', 'Bangalore', 'Karnataka', '560025', 'Quick Fix Plumbing', 6, ARRAY['Pipe Repair', 'Bathroom Fitting', 'Water Heater Installation'], 'verified', true),
  (gen_random_uuid(), 'Suresh Reddy', 'provider', '+91 9876543213', '321 Anna Salai', 'Chennai', 'Tamil Nadu', '600002', 'Safe Move Packers', 10, ARRAY['Local Moving', 'Packing', 'Office Relocation'], 'verified', true),
  (gen_random_uuid(), 'Vikram Singh', 'provider', '+91 9876543214', '654 Civil Lines', 'Delhi', 'Delhi', '110054', 'Cool Breeze AC', 7, ARRAY['AC Installation', 'Maintenance', 'Gas Filling'], 'verified', true);

-- Insert services with real data
INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Deep House Cleaning',
  'Complete deep cleaning service for your entire house including all rooms, kitchen, and bathrooms',
  2500,
  180,
  '/lovable-uploads/dc13e94f-beeb-4671-8a22-0968498cdb4c.png',
  true,
  ARRAY['Mumbai', 'Navi Mumbai', 'Thane'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Home Cleaning' AND p.business_name = 'Clean Pro Services';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Electrical Wiring Installation',
  'Professional electrical wiring installation for new constructions and renovations',
  5000,
  240,
  '/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png',
  true,
  ARRAY['Kolkata', 'Salt Lake', 'New Town'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Electrical Services' AND p.business_name = 'ElectriCare';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Bathroom Plumbing Repair',
  'Complete bathroom plumbing repair including pipes, fittings, and fixtures',
  3500,
  120,
  '/lovable-uploads/5663820f-6c97-4492-9210-9eaa1a8dc415.png',
  true,
  ARRAY['Bangalore', 'Whitefield', 'Electronic City'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Plumbing' AND p.business_name = 'Quick Fix Plumbing';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Local House Moving',
  'Professional local house moving service with packing and unpacking',
  8000,
  480,
  '/lovable-uploads/22d31f51-c174-40a7-bd95-00e4ad00eaf3.png',
  true,
  ARRAY['Chennai', 'Tambaram', 'Velachery'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Packers & Movers' AND p.business_name = 'Safe Move Packers';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'AC Installation & Service',
  'Professional AC installation and comprehensive servicing',
  4500,
  150,
  '/lovable-uploads/c3d5522b-6886-4b75-8ffc-d020016bb9c2.png',
  true,
  ARRAY['Delhi', 'Gurgaon', 'Noida'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'AC Services' AND p.business_name = 'Cool Breeze AC';

-- Add more services for variety
INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Office Cleaning Service',
  'Professional office cleaning service including desks, floors, and common areas',
  1800,
  120,
  '/lovable-uploads/dc13e94f-beeb-4671-8a22-0968498cdb4c.png',
  true,
  ARRAY['Mumbai', 'Navi Mumbai', 'Thane'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Home Cleaning' AND p.business_name = 'Clean Pro Services';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Emergency Electrical Repair',
  '24/7 emergency electrical repair service for urgent issues',
  2500,
  60,
  '/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png',
  true,
  ARRAY['Kolkata', 'Salt Lake', 'New Town'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Electrical Services' AND p.business_name = 'ElectriCare';

-- Add sample reviews
INSERT INTO reviews (customer_id, provider_id, service_id, rating, comment, is_approved)
SELECT 
  (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
  p.id,
  s.id,
  5,
  'Excellent service! Very professional and thorough cleaning.',
  true
FROM services s
JOIN profiles p ON s.provider_id = p.id
WHERE s.name = 'Deep House Cleaning';

INSERT INTO reviews (customer_id, provider_id, service_id, rating, comment, is_approved)
SELECT 
  (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
  p.id,
  s.id,
  4,
  'Quick and efficient electrical work. Highly recommended!',
  true
FROM services s
JOIN profiles p ON s.provider_id = p.id
WHERE s.name = 'Electrical Wiring Installation';