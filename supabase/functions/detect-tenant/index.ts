
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
}

interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_default?: boolean;
  branding?: TenantBranding;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 100; // 100 requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

function isDevelopmentDomain(domain: string): boolean {
  return domain === 'localhost' || 
         domain.includes('lovable.app') || 
         domain.includes('127.0.0.1') ||
         domain.includes('localhost:') ||
         domain.includes('.local');
}

async function auditLog(supabase: any, domain: string, ip: string, result: string) {
  try {
    // Optional: Log detection requests for analytics
    await supabase.from('api_logs').insert({
      endpoint: 'detect-tenant',
      method: 'POST',
      request_body: { domain },
      response_body: { result },
      ip_address: ip,
      status_code: 200,
      response_time_ms: Date.now(),
      tenant_id: null // This is a public endpoint
    });
  } catch (error) {
    console.warn('Failed to audit log:', error);
  }
}

async function detectTenantByDomain(supabase: any, domain: string): Promise<TenantResponse | null> {
  try {
    // Try exact domain mapping first
    const { data: domainMapping } = await supabase
      .from('domain_mappings')
      .select(`
        tenant_id,
        tenants!inner(id, name, slug, type)
      `)
      .eq('domain', domain)
      .eq('is_active', true)
      .single();

    if (domainMapping?.tenants) {
      const tenant = Array.isArray(domainMapping.tenants) 
        ? domainMapping.tenants[0] 
        : domainMapping.tenants;
      
      // Load branding separately
      const branding = await loadTenantBranding(supabase, tenant.id);
      
      return {
        ...tenant,
        branding
      };
    }

    // Try subdomain lookup
    const subdomain = domain.split('.')[0];
    const { data: subdomainTenant } = await supabase
      .from('tenants')
      .select('id, name, slug, type')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .single();

    if (subdomainTenant) {
      const branding = await loadTenantBranding(supabase, subdomainTenant.id);
      return {
        ...subdomainTenant,
        branding
      };
    }

    return null;
  } catch (error) {
    console.error('Domain detection error:', error);
    return null;
  }
}

async function getDefaultTenant(supabase: any): Promise<TenantResponse | null> {
  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, slug, type')
      .eq('is_default', true)
      .eq('status', 'active')
      .single();

    if (tenant) {
      const branding = await loadTenantBranding(supabase, tenant.id);
      
      return {
        ...tenant,
        is_default: true,
        branding
      };
    }
    
    return null;
  } catch (error) {
    console.error('Default tenant error:', error);
    return null;
  }
}

async function loadTenantBranding(supabase: any, tenantId: string): Promise<TenantBranding | null> {
  try {
    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('logo_url, app_name, app_tagline, primary_color, secondary_color, background_color')
      .eq('tenant_id', tenantId)
      .single();

    return branding;
  } catch (error) {
    console.warn(`Failed to load branding for tenant ${tenantId}:`, error);
    return null;
  }
}

function getEmergencyTenant(): TenantResponse {
  return {
    id: 'emergency-tenant',
    name: 'KisanShakti AI',
    slug: 'emergency',
    type: 'default',
    is_default: true,
    branding: {
      app_name: 'KisanShakti AI',
      app_tagline: 'Your smart farming journey starts here',
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      background_color: '#FFFFFF',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
    }
  };
}

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
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Apply rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { domain } = await req.json();

    if (!domain || typeof domain !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid domain parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate domain format (basic validation)
    if (domain.length > 253 || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
      return new Response(
        JSON.stringify({ error: 'Invalid domain format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result: TenantResponse | null = null;
    let detectionMethod = 'unknown';

    // Fast-track for development environments
    if (isDevelopmentDomain(domain)) {
      result = await getDefaultTenant(supabase);
      detectionMethod = result ? 'development-default' : 'development-emergency';
      
      if (!result) {
        result = getEmergencyTenant();
      }
    } else {
      // Production tenant detection flow
      // 1. Try domain/subdomain detection
      result = await detectTenantByDomain(supabase, domain);
      
      if (result) {
        detectionMethod = 'domain-mapping';
      } else {
        // 2. Fallback to default tenant
        result = await getDefaultTenant(supabase);
        detectionMethod = result ? 'default-tenant' : 'emergency-fallback';
        
        if (!result) {
          // 3. Emergency fallback
          result = getEmergencyTenant();
        }
      }
    }

    // Audit log the detection (optional)
    await auditLog(supabase, domain, clientIP, detectionMethod);

    console.log(`Tenant detection: ${domain} -> ${result.slug} (${detectionMethod})`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        method: detectionMethod
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Tenant detection error:', error);
    
    // Return emergency fallback on any error
    const emergencyTenant = getEmergencyTenant();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: emergencyTenant,
        method: 'emergency-error',
        error: 'Detection failed, using emergency fallback'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
