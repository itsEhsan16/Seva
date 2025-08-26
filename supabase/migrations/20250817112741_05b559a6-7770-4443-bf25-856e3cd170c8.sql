-- Seed data for service categories (update descriptions and images)
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

-- Insert services using existing provider profile
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
WHERE sc.name = 'Home Cleaning' AND p.role = 'provider';

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
WHERE sc.name = 'Home Cleaning' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Electrical Wiring Installation',
  'Professional electrical wiring installation for new constructions and renovations',
  5000,
  240,
  '/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png',
  true,
  ARRAY['Mumbai', 'Kolkata', 'Delhi'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Electrical Services' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Emergency Electrical Repair',
  '24/7 emergency electrical repair service for urgent issues',
  2500,
  60,
  '/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png',
  true,
  ARRAY['Mumbai', 'Kolkata', 'Delhi'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Electrical Services' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Bathroom Plumbing Repair',
  'Complete bathroom plumbing repair including pipes, fittings, and fixtures',
  3500,
  120,
  '/lovable-uploads/5663820f-6c97-4492-9210-9eaa1a8dc415.png',
  true,
  ARRAY['Bangalore', 'Chennai', 'Mumbai'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Plumbing' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Kitchen Plumbing Installation',
  'Complete kitchen plumbing installation including sink, pipes, and water connections',
  4200,
  180,
  '/lovable-uploads/5663820f-6c97-4492-9210-9eaa1a8dc415.png',
  true,
  ARRAY['Bangalore', 'Chennai', 'Mumbai'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Plumbing' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Local House Moving',
  'Professional local house moving service with packing and unpacking',
  8000,
  480,
  '/lovable-uploads/22d31f51-c174-40a7-bd95-00e4ad00eaf3.png',
  true,
  ARRAY['Chennai', 'Delhi', 'Mumbai'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Packers & Movers' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'Office Relocation Service',
  'Complete office relocation with professional packing and setup',
  15000,
  600,
  '/lovable-uploads/22d31f51-c174-40a7-bd95-00e4ad00eaf3.png',
  true,
  ARRAY['Chennai', 'Delhi', 'Mumbai'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'Packers & Movers' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'AC Installation & Service',
  'Professional AC installation and comprehensive servicing',
  4500,
  150,
  '/lovable-uploads/c3d5522b-6886-4b75-8ffc-d020016bb9c2.png',
  true,
  ARRAY['Delhi', 'Mumbai', 'Bangalore'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'AC Services' AND p.role = 'provider';

INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, service_areas, category_id, provider_id) 
SELECT 
  'AC Repair & Maintenance',
  'AC repair and maintenance service including gas filling and deep cleaning',
  2800,
  90,
  '/lovable-uploads/c3d5522b-6886-4b75-8ffc-d020016bb9c2.png',
  true,
  ARRAY['Delhi', 'Mumbai', 'Bangalore'],
  sc.id,
  p.id
FROM service_categories sc, profiles p 
WHERE sc.name = 'AC Services' AND p.role = 'provider';