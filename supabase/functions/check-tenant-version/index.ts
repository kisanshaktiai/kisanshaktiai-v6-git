
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { domain, cachedVersion } = await req.json();

    if (!domain || typeof domain !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid domain parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (cachedVersion === undefined || cachedVersion === null) {
      return new Response(
        JSON.stringify({ 
          success: true,
          needsRefresh: true,
          reason: 'No cached version provided'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse hostname to find tenant
    const parts = domain.split('.');
    let tenantId = null;
    
    // Try to find tenant through domain mappings first
    const { data: domainMapping } = await supabase
      .from('domain_mappings')
      .select('tenant_id, tenants!inner(branding_version)')
      .or(`domain.eq.${domain},domain.eq.*.${parts.slice(1).join('.')}`)
      .eq('is_active', true)
      .single();

    if (domainMapping?.tenants) {
      const tenant = Array.isArray(domainMapping.tenants) 
        ? domainMapping.tenants[0] 
        : domainMapping.tenants;
      
      const needsRefresh = tenant.branding_version !== cachedVersion;
      
      return new Response(
        JSON.stringify({
          success: true,
          needsRefresh,
          currentVersion: tenant.branding_version,
          cachedVersion: cachedVersion,
          reason: needsRefresh ? 'Version mismatch detected' : 'Cache is current'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Try subdomain lookup
    if (parts.length > 2) {
      const subdomain = parts[0];
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('branding_version')
        .or(`subdomain.eq.${subdomain},slug.eq.${subdomain}`)
        .eq('status', 'active')
        .single();

      if (tenant) {
        const needsRefresh = tenant.branding_version !== cachedVersion;
        
        return new Response(
          JSON.stringify({
            success: true,
            needsRefresh,
            currentVersion: tenant.branding_version,
            cachedVersion: cachedVersion,
            reason: needsRefresh ? 'Version mismatch detected' : 'Cache is current'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Try default tenant
    const { data: defaultTenant } = await supabase
      .from('tenants')
      .select('branding_version')
      .eq('is_default', true)
      .eq('status', 'active')
      .single();

    if (defaultTenant) {
      const needsRefresh = defaultTenant.branding_version !== cachedVersion;
      
      return new Response(
        JSON.stringify({
          success: true,
          needsRefresh,
          currentVersion: defaultTenant.branding_version,
          cachedVersion: cachedVersion,
          reason: needsRefresh ? 'Version mismatch detected' : 'Cache is current'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // No tenant found, assume refresh needed
    return new Response(
      JSON.stringify({
        success: true,
        needsRefresh: true,
        reason: 'Tenant not found, refresh recommended'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Version check error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to check version',
        needsRefresh: true // Safe fallback
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
