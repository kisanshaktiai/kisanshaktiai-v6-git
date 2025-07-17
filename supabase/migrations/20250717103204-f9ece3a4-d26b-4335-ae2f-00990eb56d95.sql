-- Create default tenant with proper UUID and valid enum
DO $$
DECLARE
  tenant_uuid uuid;
  tenant_exists boolean;
BEGIN
  -- Check if default tenant already exists
  SELECT EXISTS(SELECT 1 FROM tenants WHERE slug = 'default') INTO tenant_exists;
  
  IF NOT tenant_exists THEN
    -- Create default tenant
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
    );
  END IF;
  
  -- Get the tenant ID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default';
  
  IF tenant_uuid IS NOT NULL THEN
    -- Create default tenant branding if not exists
    IF NOT EXISTS(SELECT 1 FROM tenant_branding WHERE tenant_id = tenant_uuid) THEN
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
      );
    END IF;

    -- Create default tenant features if not exists
    IF NOT EXISTS(SELECT 1 FROM tenant_features WHERE tenant_id = tenant_uuid) THEN
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
      );
    END IF;
  END IF;
END $$;