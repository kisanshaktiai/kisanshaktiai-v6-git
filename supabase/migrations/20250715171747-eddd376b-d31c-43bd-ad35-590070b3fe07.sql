
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types for better type safety
CREATE TYPE tenant_type AS ENUM (
  'AgriCompany', 'Dealer', 'NGO', 'Government', 
  'University', 'SugarFactory', 'Cooperative', 'Insurance'
);

CREATE TYPE subscription_plan AS ENUM ('freemium', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
CREATE TYPE farmer_verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE land_type AS ENUM ('irrigated', 'rainfed', 'fallow', 'orchard', 'greenhouse');
CREATE TYPE crop_season AS ENUM ('kharif', 'rabi', 'zaid', 'perennial');

-- Master tenants table with comprehensive configuration
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type tenant_type NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  website TEXT,
  description TEXT,
  address JSONB,
  contact_person JSONB,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  max_farmers INTEGER DEFAULT 1000,
  max_dealers INTEGER DEFAULT 100,
  max_lands INTEGER DEFAULT 5000,
  max_products INTEGER DEFAULT 500,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_limits CHECK (
    max_farmers > 0 AND max_dealers > 0 AND 
    max_lands > 0 AND max_products > 0
  )
);

-- Tenant features with granular control
CREATE TABLE public.tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Core features
  ai_chat BOOLEAN DEFAULT true,
  weather_forecasts BOOLEAN DEFAULT true,
  crop_advisory BOOLEAN DEFAULT true,
  marketplace BOOLEAN DEFAULT false,
  dealer_network BOOLEAN DEFAULT false,
  analytics_dashboard BOOLEAN DEFAULT true,
  offline_sync BOOLEAN DEFAULT true,
  multilingual_support BOOLEAN DEFAULT true,
  voice_commands BOOLEAN DEFAULT false,
  video_calls BOOLEAN DEFAULT false,
  
  -- Advanced features
  satellite_imagery BOOLEAN DEFAULT false,
  soil_testing BOOLEAN DEFAULT false,
  loan_assistance BOOLEAN DEFAULT false,
  insurance_claims BOOLEAN DEFAULT false,
  precision_farming BOOLEAN DEFAULT false,
  drone_integration BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Tenant branding for white-label customization
CREATE TABLE public.tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- App branding
  app_name TEXT DEFAULT 'KisanShakti',
  app_logo_url TEXT,
  app_icon_url TEXT,
  
  -- Color scheme
  primary_color TEXT DEFAULT '#10B981',
  secondary_color TEXT DEFAULT '#059669',
  accent_color TEXT DEFAULT '#F59E0B',
  background_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT DEFAULT '#1F2937',
  
  -- Supported languages (array of language codes)
  languages JSONB DEFAULT '["hi", "en"]',
  default_language TEXT DEFAULT 'hi',
  
  -- Custom styling
  custom_css TEXT,
  fonts JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Tenant subscriptions and billing
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  plan subscription_plan NOT NULL,
  status subscription_status DEFAULT 'trial',
  
  -- Billing details
  monthly_price DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  billing_cycle INTEGER DEFAULT 30, -- days
  
  -- Subscription period
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage limits
  api_calls_limit INTEGER DEFAULT 10000,
  storage_limit_gb INTEGER DEFAULT 5,
  bandwidth_limit_gb INTEGER DEFAULT 10,
  
  -- Payment tracking
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Farmers table (shared across tenants)
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info (multilingual support)
  name JSONB NOT NULL, -- {"hi": "राज कुमार", "en": "Raj Kumar"}
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender gender,
  
  -- Address (hierarchical)
  village JSONB,
  tehsil JSONB,
  district JSONB,
  state JSONB,
  pincode TEXT,
  coordinates GEOGRAPHY(POINT, 4326),
  
  -- Verification
  verification_status farmer_verification_status DEFAULT 'pending',
  aadhaar_number TEXT UNIQUE,
  pan_number TEXT UNIQUE,
  voter_id TEXT,
  
  -- Profile
  education_level TEXT,
  primary_language TEXT DEFAULT 'hi',
  secondary_languages JSONB DEFAULT '[]',
  farming_experience_years INTEGER,
  annual_income_range TEXT,
  
  -- App usage
  last_active_at TIMESTAMP WITH TIME ZONE,
  app_version TEXT,
  device_info JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_phone CHECK (phone ~ '^\+91[6-9]\d{9}$')
);

-- Farmer-tenant associations (many-to-many)
CREATE TABLE public.farmer_tenant_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Association metadata
  role TEXT DEFAULT 'farmer', -- farmer, dealer_agent, field_officer
  status TEXT DEFAULT 'active',
  dealer_code TEXT,
  field_officer_id UUID,
  
  -- Onboarding
  onboarded_by TEXT,
  onboarding_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_documents JSONB DEFAULT '[]',
  
  -- Engagement
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  total_interactions INTEGER DEFAULT 0,
  preferred_contact_method TEXT DEFAULT 'app',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(farmer_id, tenant_id)
);

-- Lands table with geospatial support
CREATE TABLE public.lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Land details
  name JSONB NOT NULL,
  survey_number TEXT,
  area_acres DECIMAL(8,3) NOT NULL,
  boundary_polygon GEOGRAPHY(POLYGON, 4326),
  center_point GEOGRAPHY(POINT, 4326),
  
  -- Classification
  land_type land_type NOT NULL,
  soil_type TEXT,
  irrigation_type TEXT,
  water_source TEXT,
  
  -- Soil data
  soil_ph DECIMAL(3,1),
  organic_carbon DECIMAL(4,2),
  nitrogen_level TEXT,
  phosphorus_level TEXT,
  potassium_level TEXT,
  soil_test_date DATE,
  
  -- Ownership
  ownership_type TEXT, -- owned, leased, sharecropped
  lease_duration_months INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_area CHECK (area_acres > 0)
);

-- Products catalog (tenant-specific)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Product details (multilingual)
  name JSONB NOT NULL,
  description JSONB,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  
  -- Pricing
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  unit TEXT DEFAULT 'piece',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  minimum_order_quantity INTEGER DEFAULT 1,
  
  -- Specifications
  specifications JSONB DEFAULT '{}',
  images JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  available_from DATE,
  available_until DATE,
  
  -- SEO
  slug TEXT,
  tags JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

-- Dealers network
CREATE TABLE public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Dealer info
  name JSONB NOT NULL,
  business_name JSONB,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Location
  address JSONB,
  coordinates GEOGRAPHY(POINT, 4326),
  coverage_area GEOGRAPHY(POLYGON, 4326),
  
  -- Business details
  license_number TEXT,
  gst_number TEXT,
  bank_details JSONB,
  
  -- Performance metrics
  total_sales DECIMAL(12,2) DEFAULT 0,
  farmer_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI interactions tracking
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Interaction details
  session_id UUID,
  query_text TEXT,
  query_language TEXT DEFAULT 'hi',
  response_text TEXT,
  interaction_type TEXT, -- chat, voice, image_analysis
  
  -- Context
  crop_context TEXT,
  location_context GEOGRAPHY(POINT, 4326),
  weather_context JSONB,
  
  -- Processing
  processing_time_ms INTEGER,
  ai_model_version TEXT,
  confidence_score DECIMAL(3,2),
  
  -- Feedback
  user_rating INTEGER, -- 1-5
  user_feedback TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline sync queue for mobile apps
CREATE TABLE public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Sync details
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- insert, update, delete
  data JSONB,
  
  -- Status
  sync_status TEXT DEFAULT 'pending', -- pending, synced, failed
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Audit trail for compliance
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Event details
  user_id UUID,
  user_type TEXT, -- farmer, admin, dealer
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_tenant_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_type ON public.tenants(type);
CREATE INDEX idx_farmers_phone ON public.farmers(phone);
CREATE INDEX idx_farmers_coordinates ON public.farmers USING GIST(coordinates);
CREATE INDEX idx_farmer_tenant_assoc_farmer ON public.farmer_tenant_associations(farmer_id);
CREATE INDEX idx_farmer_tenant_assoc_tenant ON public.farmer_tenant_associations(tenant_id);
CREATE INDEX idx_lands_farmer ON public.lands(farmer_id);
CREATE INDEX idx_lands_tenant ON public.lands(tenant_id);
CREATE INDEX idx_lands_boundary ON public.lands USING GIST(boundary_polygon);
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_dealers_tenant ON public.dealers(tenant_id);
CREATE INDEX idx_dealers_coordinates ON public.dealers USING GIST(coordinates);
CREATE INDEX idx_ai_interactions_farmer ON public.ai_interactions(farmer_id);
CREATE INDEX idx_ai_interactions_tenant ON public.ai_interactions(tenant_id);
CREATE INDEX idx_ai_interactions_created ON public.ai_interactions(created_at);
CREATE INDEX idx_sync_queue_status ON public.offline_sync_queue(sync_status);
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- Full text search indexes
CREATE INDEX idx_farmers_name_gin ON public.farmers USING GIN((name::text));
CREATE INDEX idx_products_name_gin ON public.products USING GIN((name::text));
CREATE INDEX idx_dealers_name_gin ON public.dealers USING GIN((name::text));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('tenant-assets', 'tenant-assets', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']),
('farmer-media', 'farmer-media', false, 104857600, ARRAY['image/png', 'image/jpeg', 'video/mp4']),
('product-catalog', 'product-catalog', true, 52428800, ARRAY['image/png', 'image/jpeg', 'application/pdf']),
('ai-models', 'ai-models', false, 2147483648, ARRAY['application/octet-stream']),
('reports', 'reports', false, 104857600, ARRAY['application/pdf', 'text/csv', 'application/vnd.ms-excel']);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_features_updated_at BEFORE UPDATE ON public.tenant_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_branding_updated_at BEFORE UPDATE ON public.tenant_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_subscriptions_updated_at BEFORE UPDATE ON public.tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmer_tenant_associations_updated_at BEFORE UPDATE ON public.farmer_tenant_associations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lands_updated_at BEFORE UPDATE ON public.lands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON public.dealers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
