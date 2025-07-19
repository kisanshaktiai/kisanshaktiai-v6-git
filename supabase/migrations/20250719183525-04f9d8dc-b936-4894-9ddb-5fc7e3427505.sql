
-- Phase 1: Critical Fixes - Fix RLS Infinite Recursion and Standardize Subscription Plans

-- 1. Fix RLS infinite recursion by using security definer functions
-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admin users can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage all admin users" ON public.admin_users;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() 
    AND is_active = true 
    AND role IN ('super_admin', 'platform_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_current_user_active_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create non-recursive RLS policies
CREATE POLICY "Admin users can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.is_current_user_admin());

CREATE POLICY "Admin users can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_current_user_active_admin());

-- 2. Standardize subscription plans - Update enum and existing data
-- Drop existing enum if it exists and create new one
DROP TYPE IF EXISTS subscription_plan CASCADE;
CREATE TYPE subscription_plan AS ENUM ('kisan', 'shakti', 'ai');

-- Update tenants table to use new enum
ALTER TABLE public.tenants 
ALTER COLUMN subscription_plan TYPE subscription_plan 
USING (
  CASE subscription_plan::text
    WHEN 'starter' THEN 'kisan'::subscription_plan
    WHEN 'growth' THEN 'shakti'::subscription_plan
    WHEN 'enterprise' THEN 'ai'::subscription_plan
    ELSE 'kisan'::subscription_plan
  END
);

-- Update billing_plans table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_plans' AND column_name = 'name') THEN
    UPDATE public.billing_plans 
    SET name = CASE 
      WHEN name = 'starter' THEN 'kisan'
      WHEN name = 'growth' THEN 'shakti'
      WHEN name = 'enterprise' THEN 'ai'
      ELSE name
    END;
  END IF;
END $$;

-- 3. Fix tenant creation function to use new plan types
CREATE OR REPLACE FUNCTION public.create_tenant_with_validation(
  p_name text,
  p_slug text,
  p_type text,
  p_status text DEFAULT 'trial'::text,
  p_subscription_plan text DEFAULT 'kisan'::text,
  p_owner_name text DEFAULT NULL::text,
  p_owner_email text DEFAULT NULL::text,
  p_owner_phone text DEFAULT NULL::text,
  p_business_registration text DEFAULT NULL::text,
  p_business_address jsonb DEFAULT NULL::jsonb,
  p_established_date text DEFAULT NULL::text,
  p_subscription_start_date text DEFAULT NULL::text,
  p_subscription_end_date text DEFAULT NULL::text,
  p_trial_ends_at text DEFAULT NULL::text,
  p_max_farmers integer DEFAULT NULL::integer,
  p_max_dealers integer DEFAULT NULL::integer,
  p_max_products integer DEFAULT NULL::integer,
  p_max_storage_gb integer DEFAULT NULL::integer,
  p_max_api_calls_per_day integer DEFAULT NULL::integer,
  p_subdomain text DEFAULT NULL::text,
  p_custom_domain text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_plan_limits JSONB;
BEGIN
  -- Validate subscription plan
  IF p_subscription_plan NOT IN ('kisan', 'shakti', 'ai') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid subscription plan. Must be: kisan, shakti, or ai'
    );
  END IF;
  
  -- Set default limits based on subscription plan
  CASE p_subscription_plan
    WHEN 'kisan' THEN
      v_plan_limits := jsonb_build_object(
        'farmers', 1000,
        'dealers', 50,
        'products', 100,
        'storage', 10,
        'api_calls', 10000
      );
    WHEN 'shakti' THEN
      v_plan_limits := jsonb_build_object(
        'farmers', 5000,
        'dealers', 200,
        'products', 500,
        'storage', 50,
        'api_calls', 50000
      );
    WHEN 'ai' THEN
      v_plan_limits := jsonb_build_object(
        'farmers', 20000,
        'dealers', 1000,
        'products', 2000,
        'storage', 200,
        'api_calls', 200000
      );
  END CASE;
  
  -- Use provided limits or defaults
  p_max_farmers := COALESCE(p_max_farmers, (v_plan_limits->>'farmers')::INTEGER);
  p_max_dealers := COALESCE(p_max_dealers, (v_plan_limits->>'dealers')::INTEGER);
  p_max_products := COALESCE(p_max_products, (v_plan_limits->>'products')::INTEGER);
  p_max_storage_gb := COALESCE(p_max_storage_gb, (v_plan_limits->>'storage')::INTEGER);
  p_max_api_calls_per_day := COALESCE(p_max_api_calls_per_day, (v_plan_limits->>'api_calls')::INTEGER);
  
  -- Insert tenant
  INSERT INTO tenants (
    name, slug, type, status, subscription_plan,
    owner_name, owner_email, owner_phone,
    business_registration, business_address, established_date,
    subscription_start_date, subscription_end_date, trial_ends_at,
    max_farmers, max_dealers, max_products, max_storage_gb, max_api_calls_per_day,
    subdomain, custom_domain, metadata,
    created_at, updated_at
  ) VALUES (
    p_name, p_slug, p_type::text, p_status::text, p_subscription_plan::subscription_plan,
    p_owner_name, p_owner_email, p_owner_phone,
    p_business_registration, p_business_address, 
    CASE WHEN p_established_date IS NOT NULL THEN p_established_date::DATE ELSE NULL END,
    CASE WHEN p_subscription_start_date IS NOT NULL THEN p_subscription_start_date::TIMESTAMP WITH TIME ZONE ELSE now() END,
    CASE WHEN p_subscription_end_date IS NOT NULL THEN p_subscription_end_date::TIMESTAMP WITH TIME ZONE ELSE NULL END,
    CASE WHEN p_trial_ends_at IS NOT NULL THEN p_trial_ends_at::TIMESTAMP WITH TIME ZONE ELSE now() + interval '14 days' END,
    p_max_farmers, p_max_dealers, p_max_products, p_max_storage_gb, p_max_api_calls_per_day,
    p_subdomain, p_custom_domain, p_metadata,
    now(), now()
  ) RETURNING id INTO v_tenant_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'message', 'Tenant created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_active_role ON public.admin_users (id, is_active, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON public.tenants (subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_tenants_active ON public.user_tenants (user_id, tenant_id, is_active) WHERE is_active = true;

-- 5. Update default tenant to use new plan type
UPDATE public.tenants 
SET subscription_plan = 'kisan'::subscription_plan 
WHERE slug = 'default' AND subscription_plan IS NULL;
