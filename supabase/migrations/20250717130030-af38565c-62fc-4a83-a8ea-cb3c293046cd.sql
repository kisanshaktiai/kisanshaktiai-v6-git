-- Ensure default tenant exists with proper UUID and required fields
INSERT INTO public.tenants (
  id, 
  slug, 
  name, 
  type,
  subscription_plan,
  status, 
  created_at, 
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'default',
  'KisanShakti AI',
  'agri_company',
  'starter',
  'active',
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  id = '00000000-0000-0000-0000-000000000000',
  name = 'KisanShakti AI',
  type = 'agri_company',
  subscription_plan = 'starter',
  status = 'active',
  updated_at = now();

-- Ensure default tenant branding exists
INSERT INTO public.tenant_branding (
  tenant_id,
  logo_url,
  app_name,
  app_tagline,
  primary_color,
  background_color,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
  'KisanShaktiAI',
  'Intelligent Guru for Farmers',
  '#4D7C0F',
  '#FFFFFF',
  now(),
  now()
) ON CONFLICT (tenant_id) DO UPDATE SET
  logo_url = '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
  app_name = 'KisanShaktiAI',
  app_tagline = 'Intelligent Guru for Farmers',
  primary_color = '#4D7C0F',
  background_color = '#FFFFFF',
  updated_at = now();