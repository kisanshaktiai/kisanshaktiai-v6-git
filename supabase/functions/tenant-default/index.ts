
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface DefaultTenantResponse {
  id: string;
  name: string;
  branding: {
    app_name: string;
    app_tagline: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
  };
  features: {
    ai_chat: boolean;
    weather_forecast: boolean;
    marketplace: boolean;
    community_forum: boolean;
    satellite_imagery: boolean;
    soil_testing: boolean;
    basic_analytics: boolean;
  };
}

// In-memory cache
let cachedData: DefaultTenantResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function fetchDefaultTenant(): Promise<DefaultTenantResponse | null> {
  try {
    console.log('Fetching default tenant from database');
    
    // Fetch default tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, type, status, subscription_plan')
      .eq('is_default', true)
      .eq('status', 'active')
      .maybeSingle();

    if (tenantError) {
      console.error('Error fetching tenant:', tenantError);
      return null;
    }

    if (!tenant) {
      console.log('No default tenant found');
      return null;
    }

    console.log('Found default tenant:', tenant.id);

    // Fetch branding and features in parallel
    const [brandingResult, featuresResult] = await Promise.allSettled([
      supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle(),
      supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle()
    ]);

    const branding = brandingResult.status === 'fulfilled' && !brandingResult.value.error 
      ? brandingResult.value.data 
      : null;

    const features = featuresResult.status === 'fulfilled' && !featuresResult.value.error 
      ? featuresResult.value.data 
      : null;

    // Prepare response with defaults
    const response: DefaultTenantResponse = {
      id: tenant.id,
      name: tenant.name,
      branding: {
        app_name: branding?.app_name || 'KisanShakti AI',
        app_tagline: branding?.app_tagline || 'Your Smart Farming Assistant',
        logo_url: branding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
        primary_color: branding?.primary_color || '#8BC34A',
        secondary_color: branding?.secondary_color || '#4CAF50',
        accent_color: branding?.accent_color || '#689F38',
        background_color: branding?.background_color || '#FFFFFF',
        text_color: branding?.text_color || '#1F2937'
      },
      features: {
        ai_chat: features?.ai_chat ?? true,
        weather_forecast: features?.weather_forecast ?? true,
        marketplace: features?.marketplace ?? true,
        community_forum: features?.community_forum ?? true,
        satellite_imagery: features?.satellite_imagery ?? true,
        soil_testing: features?.soil_testing ?? true,
        basic_analytics: features?.basic_analytics ?? true
      }
    };

    return response;
  } catch (error) {
    console.error('Error in fetchDefaultTenant:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached data');
      return new Response(
        JSON.stringify(cachedData),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // 5 minutes
          } 
        }
      );
    }

    // Fetch fresh data
    const tenantData = await fetchDefaultTenant();
    
    if (!tenantData) {
      return new Response(
        JSON.stringify({ error: 'Default tenant not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update cache
    cachedData = tenantData;
    cacheTimestamp = now;

    console.log('Returning fresh data and updating cache');
    return new Response(
      JSON.stringify(tenantData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
