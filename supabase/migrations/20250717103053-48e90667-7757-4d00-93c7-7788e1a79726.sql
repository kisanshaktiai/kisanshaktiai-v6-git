-- Create default tenant with proper UUID and valid enum
INSERT INTO tenants (
  id,
  name,
  slug,
  type,
  status,
  subscription_plan,
  owner_name,
  owner_email,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'KisanShakti AI',
  'default',
  'agri_company',
  'active',
  'starter',
  'System Administrator',
  'admin@kisanshakti.app',
  now(),
  now()
) ON CONFLICT (slug) DO NOTHING;

-- Get the tenant ID for branding
DO $$
DECLARE
  tenant_uuid uuid;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default';
  
  IF tenant_uuid IS NOT NULL THEN
    -- Create default tenant branding
    INSERT INTO tenant_branding (
      tenant_id,
      app_name,
      app_tagline,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      text_color,
      logo_url,
      created_at,
      updated_at
    ) VALUES (
      tenant_uuid,
      'KisanShaktiAI',
      'Intelligent Guru for Farmers',
      '#4D7C0F',
      '#065F46',
      '#F59E0B',
      '#FFFFFF',
      '#111827',
      '/lovable-uploads/180cdfdf-9869-4c78-ace0-fdb76e9273b4.png',
      now(),
      now()
    ) ON CONFLICT (tenant_id) DO NOTHING;

    -- Create default tenant features
    INSERT INTO tenant_features (
      tenant_id,
      ai_chat,
      weather_forecast,
      basic_analytics,
      community_forum,
      marketplace,
      created_at,
      updated_at
    ) VALUES (
      tenant_uuid,
      true,
      true,
      true,
      true,
      true,
      now(),
      now()
    ) ON CONFLICT (tenant_id) DO NOTHING;
  END IF;
END $$;