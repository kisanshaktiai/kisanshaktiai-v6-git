
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create custom types
CREATE TYPE tenant_type AS ENUM (
  'agri_company', 'dealer', 'ngo', 'government', 
  'university', 'sugar_factory', 'cooperative', 'insurance'
);

CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('starter', 'growth', 'enterprise', 'custom');
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_owner', 'tenant_admin', 'tenant_manager', 'dealer', 'agent', 'farmer');
CREATE TYPE language_code AS ENUM ('en', 'hi', 'mr', 'pa', 'gu', 'te', 'ta', 'kn', 'ml', 'or', 'bn');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'failed');

-- Master tenant table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type tenant_type NOT NULL,
  status tenant_status DEFAULT 'trial',
  
  -- Contact Information
  owner_name VARCHAR(255),
  owner_email VARCHAR(255),
  owner_phone VARCHAR(20),
  
  -- Business Details
  business_registration VARCHAR(100),
  business_address JSONB,
  established_date DATE,
  
  -- Subscription
  subscription_plan subscription_plan DEFAULT 'starter',
  subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
  subscription_end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Limits (based on plan)
  max_farmers INTEGER DEFAULT 1000,
  max_dealers INTEGER DEFAULT 50,
  max_products INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 10,
  max_api_calls_per_day INTEGER DEFAULT 10000,
  
  -- White Label Configuration
  subdomain VARCHAR(100) UNIQUE,
  custom_domain VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Tenant branding configuration
CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Colors
  primary_color VARCHAR(7) DEFAULT '#10B981',
  secondary_color VARCHAR(7) DEFAULT '#065F46',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#111827',
  
  -- Assets
  logo_url TEXT,
  favicon_url TEXT,
  splash_screen_url TEXT,
  app_icon_url TEXT,
  
  -- Branding
  app_name VARCHAR(100) DEFAULT 'KisanShakti AI',
  app_tagline VARCHAR(255),
  company_description TEXT,
  
  -- Fonts
  font_family VARCHAR(100) DEFAULT 'Inter',
  custom_css TEXT,
  
  -- Email Templates
  email_header_html TEXT,
  email_footer_html TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags per tenant
CREATE TABLE IF NOT EXISTS tenant_features (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Core Features
  ai_chat BOOLEAN DEFAULT true,
  weather_forecast BOOLEAN DEFAULT true,
  marketplace BOOLEAN DEFAULT true,
  community_forum BOOLEAN DEFAULT true,
  
  -- Advanced Features
  satellite_imagery BOOLEAN DEFAULT false,
  soil_testing BOOLEAN DEFAULT false,
  drone_monitoring BOOLEAN DEFAULT false,
  iot_integration BOOLEAN DEFAULT false,
  
  -- Commerce Features
  ecommerce BOOLEAN DEFAULT false,
  payment_gateway BOOLEAN DEFAULT false,
  inventory_management BOOLEAN DEFAULT false,
  logistics_tracking BOOLEAN DEFAULT false,
  
  -- Analytics Features
  basic_analytics BOOLEAN DEFAULT true,
  advanced_analytics BOOLEAN DEFAULT false,
  predictive_analytics BOOLEAN DEFAULT false,
  custom_reports BOOLEAN DEFAULT false,
  
  -- Integration Features
  api_access BOOLEAN DEFAULT false,
  webhook_support BOOLEAN DEFAULT false,
  third_party_integrations BOOLEAN DEFAULT false,
  white_label_mobile_app BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extended auth.users with profile data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  
  -- Personal Information
  full_name VARCHAR(255),
  display_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  
  -- Location
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  village VARCHAR(100),
  taluka VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(50) DEFAULT 'India',
  coordinates GEOGRAPHY(POINT, 4326),
  
  -- Preferences
  preferred_language language_code DEFAULT 'hi',
  notification_preferences JSONB DEFAULT '{
    "sms": true,
    "push": true,
    "email": false,
    "whatsapp": true,
    "calls": false
  }',
  
  -- Profile
  avatar_url TEXT,
  bio TEXT,
  expertise_areas TEXT[],
  
  -- Metadata
  device_tokens JSONB DEFAULT '[]',
  last_active_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tenant associations
CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  
  -- Permissions
  permissions JSONB DEFAULT '[]',
  is_primary BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  
  -- Metadata
  department VARCHAR(100),
  designation VARCHAR(100),
  employee_id VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- Farmer profiles (extends user_profiles)
CREATE TABLE IF NOT EXISTS farmers (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  farmer_code VARCHAR(50) UNIQUE,
  
  -- Farming Details
  farming_experience_years INTEGER,
  farm_type VARCHAR(50),
  total_land_acres DECIMAL(10,2),
  primary_crops TEXT[],
  
  -- Economic Status
  annual_income_range VARCHAR(50),
  has_loan BOOLEAN DEFAULT false,
  loan_amount DECIMAL(12,2),
  
  -- Equipment & Resources
  has_tractor BOOLEAN DEFAULT false,
  has_irrigation BOOLEAN DEFAULT false,
  irrigation_type VARCHAR(50),
  has_storage BOOLEAN DEFAULT false,
  
  -- Associations
  associated_tenants UUID[],
  preferred_dealer_id UUID,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_documents JSONB DEFAULT '[]',
  
  -- Analytics
  app_install_date DATE,
  last_app_open TIMESTAMPTZ,
  total_app_opens INTEGER DEFAULT 0,
  total_queries INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing lands table to match new schema
ALTER TABLE lands ADD COLUMN IF NOT EXISTS area_guntas DECIMAL(10,2);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS village VARCHAR(100);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS taluka VARCHAR(100);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS boundary GEOGRAPHY(POLYGON, 4326);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS center_point GEOGRAPHY(POINT, 4326);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS land_type VARCHAR(50);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS water_source VARCHAR(50);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS elevation_meters INTEGER;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS slope_percentage DECIMAL(5,2);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS current_crop VARCHAR(100);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS crop_stage VARCHAR(50);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS last_sowing_date DATE;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS expected_harvest_date DATE;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS soil_ph DECIMAL(3,1);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS organic_carbon_percent DECIMAL(3,2);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS nitrogen_kg_per_ha DECIMAL(6,2);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS phosphorus_kg_per_ha DECIMAL(6,2);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS potassium_kg_per_ha DECIMAL(6,2);
ALTER TABLE lands ADD COLUMN IF NOT EXISTS last_soil_test_date DATE;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS land_documents JSONB DEFAULT '[]';
ALTER TABLE lands ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Rename existing boundary_polygon and center_point columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='boundary_polygon') THEN
    ALTER TABLE lands RENAME COLUMN boundary_polygon TO boundary_polygon_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lands' AND column_name='center_point') THEN
    ALTER TABLE lands RENAME COLUMN center_point TO center_point_old;
  END IF;
END$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_farmers_tenant_assoc ON farmers USING GIN(associated_tenants);
CREATE INDEX IF NOT EXISTS idx_lands_farmer ON lands(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lands_boundary ON lands USING GIST(boundary);

-- Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenant_branding_updated_at BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenant_features_updated_at BEFORE UPDATE ON tenant_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_tenants_updated_at BEFORE UPDATE ON user_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Farmers can view their own data" ON farmers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Farmers can update their own data" ON farmers
  FOR UPDATE USING (auth.uid() = id);

-- Insert sample data
INSERT INTO tenants (slug, name, type, subscription_plan) 
VALUES ('demo-agri', 'Demo AgriTech Company', 'agri_company', 'growth')
ON CONFLICT (slug) DO NOTHING;
