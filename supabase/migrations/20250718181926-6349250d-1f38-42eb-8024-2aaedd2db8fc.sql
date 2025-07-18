
-- First, ensure we have the correct default tenant ID
UPDATE public.tenants 
SET id = '66372c6f-c996-4425-8749-a7561e5d6ae3'
WHERE slug = 'default';

-- If the tenant doesn't exist, create it
INSERT INTO public.tenants (
  id,
  name,
  slug,
  type,
  owner_name,
  owner_email,
  owner_phone,
  status,
  subscription_plan,
  max_farmers,
  max_dealers,
  max_products,
  max_storage_gb,
  max_api_calls_per_day,
  created_at,
  updated_at
) VALUES (
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'KisanShakti AI',
  'default',
  'agri_company',
  'System Administrator',
  'admin@kisanshakti.app',
  '9860989495',
  'active',
  'enterprise',
  10000,
  500,
  1000,
  100,
  100000,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  updated_at = now();

-- Ensure tenant branding exists
INSERT INTO public.tenant_branding (
  tenant_id,
  app_name,
  app_tagline,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  font_family,
  created_at,
  updated_at
) VALUES (
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'KisanShakti AI',
  'Intelligent Guru for Farmers',
  '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  '#8BC34A',
  '#4CAF50',
  '#689F38',
  '#FFFFFF',
  '#1F2937',
  'Inter',
  now(),
  now()
) ON CONFLICT (tenant_id) DO UPDATE SET
  app_name = EXCLUDED.app_name,
  app_tagline = EXCLUDED.app_tagline,
  logo_url = EXCLUDED.logo_url,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color,
  updated_at = now();

-- Ensure tenant features exist
INSERT INTO public.tenant_features (
  tenant_id,
  ai_chat,
  weather_forecast,
  marketplace,
  basic_analytics,
  community_forum,
  satellite_imagery,
  soil_testing,
  drone_monitoring,
  iot_integration,
  ecommerce,
  payment_gateway,
  inventory_management,
  logistics_tracking,
  created_at,
  updated_at
) VALUES (
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  now(),
  now()
) ON CONFLICT (tenant_id) DO UPDATE SET
  ai_chat = EXCLUDED.ai_chat,
  weather_forecast = EXCLUDED.weather_forecast,
  marketplace = EXCLUDED.marketplace,
  basic_analytics = EXCLUDED.basic_analytics,
  community_forum = EXCLUDED.community_forum,
  satellite_imagery = EXCLUDED.satellite_imagery,
  soil_testing = EXCLUDED.soil_testing,
  drone_monitoring = EXCLUDED.drone_monitoring,
  iot_integration = EXCLUDED.iot_integration,
  ecommerce = EXCLUDED.ecommerce,
  payment_gateway = EXCLUDED.payment_gateway,
  inventory_management = EXCLUDED.inventory_management,
  logistics_tracking = EXCLUDED.logistics_tracking,
  updated_at = now();

-- Add dummy farmers with the default tenant
INSERT INTO public.farmers (
  id,
  tenant_id,
  farmer_code,
  mobile_number,
  pin_hash,
  total_land_acres,
  farming_experience_years,
  farm_type,
  primary_crops,
  annual_income_range,
  has_irrigation,
  has_tractor,
  has_storage,
  irrigation_type,
  app_install_date,
  is_verified,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'F9876_' || extract(epoch from now())::text,
  '9876543210',
  '$2b$10$dummy.hash.for.demo.purposes.only',
  5.5,
  10,
  'mixed',
  ARRAY['wheat', 'rice'],
  '2-5 lakhs',
  true,
  false,
  true,
  'drip',
  CURRENT_DATE,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'F8765_' || extract(epoch from now())::text,
  '8765432109',
  '$2b$10$dummy.hash.for.demo.purposes.only',
  3.2,
  7,
  'organic',
  ARRAY['cotton', 'sugarcane'],
  '1-2 lakhs',
  false,
  true,
  false,
  'rainfed',
  CURRENT_DATE,
  false,
  now(),
  now()
),
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'F7654_' || extract(epoch from now())::text,
  '7654321098',
  '$2b$10$dummy.hash.for.demo.purposes.only',
  8.0,
  15,
  'commercial',
  ARRAY['tomato', 'onion', 'potato'],
  '5-10 lakhs',
  true,
  true,
  true,
  'flood',
  CURRENT_DATE,
  true,
  now(),
  now()
);

-- Add dummy dealers
INSERT INTO public.dealers (
  id,
  tenant_id,
  dealer_code,
  business_name,
  contact_person,
  email,
  phone,
  business_type,
  business_address,
  registration_status,
  verification_status,
  kyc_status,
  commission_rate,
  credit_limit,
  performance_rating,
  is_active,
  onboarding_date,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'D001_DEMO',
  'Green Valley Agro Supplies',
  'Rajesh Kumar',
  'rajesh@greenvalley.com',
  '9876543211',
  'retailer',
  '{"street": "MG Road", "city": "Pune", "state": "Maharashtra", "pincode": "411001"}',
  'approved',
  'verified',
  'completed',
  7.5,
  100000,
  4.2,
  true,
  CURRENT_DATE,
  now(),
  now()
),
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  'D002_DEMO',
  'Krishi Seva Kendra',
  'Suresh Patil',
  'suresh@krishiseva.com',
  '9876543212',
  'distributor',
  '{"street": "Station Road", "city": "Nashik", "state": "Maharashtra", "pincode": "422001"}',
  'approved',
  'verified',
  'completed',
  5.0,
  250000,
  4.5,
  true,
  CURRENT_DATE,
  now(),
  now()
);

-- Add dummy products
INSERT INTO public.products (
  id,
  tenant_id,
  name,
  description,
  category,
  subcategory,
  brand,
  price,
  currency,
  unit,
  discount_percentage,
  stock_quantity,
  minimum_order_quantity,
  specifications,
  images,
  is_active,
  is_featured,
  tags,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  '{"en": "NPK Fertilizer 20-20-20", "hi": "एनपीके उर्वरक 20-20-20"}',
  '{"en": "Balanced NPK fertilizer for all crops", "hi": "सभी फसलों के लिए संतुलित एनपीके उर्वरक"}',
  'fertilizer',
  'npk',
  'IFFCO',
  850.00,
  'INR',
  'bag_50kg',
  10,
  100,
  1,
  '{"nitrogen": "20%", "phosphorus": "20%", "potassium": "20%", "weight": "50kg"}',
  ARRAY['/images/npk-fertilizer.jpg'],
  true,
  true,
  ARRAY['fertilizer', 'npk', 'crop-nutrition'],
  now(),
  now()
),
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  '{"en": "Urea Fertilizer", "hi": "यूरिया उर्वरक"}',
  '{"en": "High quality urea for nitrogen supply", "hi": "नाइट्रोजन आपूर्ति के लिए उच्च गुणवत्ता यूरिया"}',
  'fertilizer',
  'nitrogen',
  'IFFCO',
  650.00,
  'INR',
  'bag_50kg',
  5,
  200,
  1,
  '{"nitrogen": "46%", "weight": "50kg"}',
  ARRAY['/images/urea-fertilizer.jpg'],
  true,
  false,
  ARRAY['fertilizer', 'urea', 'nitrogen'],
  now(),
  now()
),
(
  gen_random_uuid(),
  '66372c6f-c996-4425-8749-a7561e5d6ae3',
  '{"en": "Tomato Seeds - Hybrid", "hi": "टमाटर के बीज - हाइब्रिड"}',
  '{"en": "High yield hybrid tomato seeds", "hi": "उच्च उत्पादन हाइब्रिड टमाटर के बीज"}',
  'seeds',
  'vegetable',
  'Mahyco',
  120.00,
  'INR',
  'packet_10g',
  0,
  50,
  1,
  '{"variety": "Hybrid", "weight": "10g", "germination": "85%"}',
  ARRAY['/images/tomato-seeds.jpg'],
  true,
  true,
  ARRAY['seeds', 'tomato', 'hybrid', 'vegetable'],
  now(),
  now()
);

-- Add sample market prices
INSERT INTO public.market_prices (
  id,
  crop_name,
  variety,
  market_location,
  district,
  state,
  price_per_unit,
  unit,
  price_date,
  price_type,
  quality_grade,
  source,
  metadata,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'tomato',
  'hybrid',
  'Pune APMC',
  'Pune',
  'Maharashtra',
  2500.00,
  'quintal',
  CURRENT_DATE,
  'wholesale',
  'A',
  'apmc',
  '{"arrival_quantity": "150 quintals", "previous_price": "2300"}',
  now()
),
(
  gen_random_uuid(),
  'onion',
  'red',
  'Nashik APMC',
  'Nashik',
  'Maharashtra',
  1800.00,
  'quintal',
  CURRENT_DATE,
  'wholesale',
  'A',
  'apmc',
  '{"arrival_quantity": "300 quintals", "previous_price": "1750"}',
  now()
),
(
  gen_random_uuid(),
  'wheat',
  'durum',
  'Mumbai APMC',
  'Mumbai',
  'Maharashtra',
  2200.00,
  'quintal',
  CURRENT_DATE,
  'wholesale',
  'B',
  'apmc',
  '{"arrival_quantity": "500 quintals", "previous_price": "2180"}',
  now()
);

-- Update all existing records without tenant_id to use default tenant
UPDATE public.marketplace_saved_items 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.resource_usage 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.land_activities 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.soil_health 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.crop_history 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.ndvi_data 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.satellite_imagery 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.crop_health_assessments 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.satellite_alerts 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.prescription_maps 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.yield_predictions 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.weather_preferences 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.weather_activity_recommendations 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.analytics_reports 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.financial_transactions 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.api_keys 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.api_logs 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.dealers 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;

UPDATE public.marketplace_transactions 
SET tenant_id = '66372c6f-c996-4425-8749-a7561e5d6ae3' 
WHERE tenant_id IS NULL;
