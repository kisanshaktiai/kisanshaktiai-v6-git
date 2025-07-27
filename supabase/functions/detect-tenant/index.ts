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
  version?: number;
}

interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_default?: boolean;
  branding?: TenantBranding;
  branding_version?: number;
  branding_updated_at?: string;
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
         domain.includes('.local') ||
         domain.includes('192.168.') ||
         domain.includes('10.0.') ||
         domain === '0.0.0.0';
}

function parseHostname(hostname: string): { subdomain: string | null; domain: string; fullDomain: string } {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  // Split by dots
  const parts = cleanHostname.split('.');
  
  if (parts.length <= 2) {
    // No subdomain (e.g., example.com or localhost)
    return {
      subdomain: null,
      domain: cleanHostname,
      fullDomain: cleanHostname
    };
  }
  
  // Extract subdomain and main domain
  const subdomain = parts[0];
  const domain = parts.slice(1).join('.');
  
  return {
    subdomain,
    domain,
    fullDomain: cleanHostname
  };
}

async function auditLog(supabase: any, domain: string, ip: string, result: string, method: string) {
  try {
    // Optional: Log detection requests for analytics
    await supabase.from('api_logs').insert({
      endpoint: 'detect-tenant',
      method: 'POST',
      request_body: { domain },
      response_body: { result, method },
      ip_address: ip,
      status_code: 200,
      response_time_ms: Date.now(),
      tenant_id: null // This is a public endpoint
    });
  } catch (error) {
    console.warn('Failed to audit log:', error);
  }
}

async function detectTenantByDomain(supabase: any, hostname: string): Promise<{ tenant: TenantResponse | null; method: string }> {
  try {
    const { subdomain, domain, fullDomain } = parseHostname(hostname);
    
    console.log('Parsing hostname:', { hostname, subdomain, domain, fullDomain });

    // 1. Try exact match for full hostname in domain_mappings
    const { data: exactDomainMapping } = await supabase
      .from('domain_mappings')
      .select(`
        tenant_id,
        version,
        tenants!inner(id, name, slug, type, status, branding_version, branding_updated_at)
      `)
      .eq('domain', fullDomain)
      .eq('is_active', true)
      .eq('tenants.status', 'active')
      .single();

    if (exactDomainMapping?.tenants) {
      const tenant = Array.isArray(exactDomainMapping.tenants) 
        ? exactDomainMapping.tenants[0] 
        : exactDomainMapping.tenants;
      
      const branding = await loadTenantBranding(supabase, tenant.id);
      
      console.log('Found tenant by exact domain mapping:', tenant.slug);
      return {
        tenant: { 
          ...tenant, 
          branding,
          branding_version: tenant.branding_version,
          branding_updated_at: tenant.branding_updated_at
        },
        method: 'exact-domain-mapping'
      };
    }

    // 2. Try wildcard domain mapping (*.example.com)
    if (subdomain && domain) {
      const wildcardDomain = `*.${domain}`;
      const { data: wildcardMapping } = await supabase
        .from('domain_mappings')
        .select(`
          tenant_id,
          version,
          tenants!inner(id, name, slug, type, status, branding_version, branding_updated_at)
        `)
        .eq('domain', wildcardDomain)
        .eq('is_active', true)
        .eq('tenants.status', 'active')
        .single();

      if (wildcardMapping?.tenants) {
        const tenant = Array.isArray(wildcardMapping.tenants) 
          ? wildcardMapping.tenants[0] 
          : wildcardMapping.tenants;
        
        const branding = await loadTenantBranding(supabase, tenant.id);
        
        console.log('Found tenant by wildcard domain mapping:', tenant.slug);
        return {
          tenant: { 
            ...tenant, 
            branding,
            branding_version: tenant.branding_version,
            branding_updated_at: tenant.branding_updated_at
          },
          method: 'wildcard-domain-mapping'
        };
      }
    }

    // 3. Try base domain mapping (example.com)
    if (subdomain && domain) {
      const { data: baseDomainMapping } = await supabase
        .from('domain_mappings')
        .select(`
          tenant_id,
          version,
          tenants!inner(id, name, slug, type, status, branding_version, branding_updated_at)
        `)
        .eq('domain', domain)
        .eq('is_active', true)
        .eq('tenants.status', 'active')
        .single();

      if (baseDomainMapping?.tenants) {
        const tenant = Array.isArray(baseDomainMapping.tenants) 
          ? baseDomainMapping.tenants[0] 
          : baseDomainMapping.tenants;
        
        const branding = await loadTenantBranding(supabase, tenant.id);
        
        console.log('Found tenant by base domain mapping:', tenant.slug);
        return {
          tenant: { 
            ...tenant, 
            branding,
            branding_version: tenant.branding_version,
            branding_updated_at: tenant.branding_updated_at
          },
          method: 'base-domain-mapping'
        };
      }
    }

    // 4. Try subdomain lookup in tenants table
    if (subdomain) {
      const { data: subdomainTenant } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, branding_version, branding_updated_at')
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      if (subdomainTenant) {
        const branding = await loadTenantBranding(supabase, subdomainTenant.id);
        
        console.log('Found tenant by subdomain:', subdomainTenant.slug);
        return {
          tenant: { 
            ...subdomainTenant, 
            branding,
            branding_version: subdomainTenant.branding_version,
            branding_updated_at: subdomainTenant.branding_updated_at
          },
          method: 'subdomain-mapping'
        };
      }
    }

    // 5. Try slug-based lookup (if subdomain could be a tenant slug)
    if (subdomain) {
      const { data: slugTenant } = await supabase
        .from('tenants')
        .select('id, name, slug, type, status, branding_version, branding_updated_at')
        .eq('slug', subdomain)
        .eq('status', 'active')
        .single();

      if (slugTenant) {
        const branding = await loadTenantBranding(supabase, slugTenant.id);
        
        console.log('Found tenant by slug mapping:', slugTenant.slug);
        return {
          tenant: { 
            ...slugTenant, 
            branding,
            branding_version: slugTenant.branding_version,
            branding_updated_at: slugTenant.branding_updated_at
          },
          method: 'slug-mapping'
        };
      }
    }

    return { tenant: null, method: 'not-found' };
  } catch (error) {
    console.error('Domain detection error:', error);
    return { tenant: null, method: 'error' };
  }
}

async function getDefaultTenant(supabase: any): Promise<TenantResponse | null> {
  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, slug, type, status, branding_version, branding_updated_at')
      .eq('is_default', true)
      .eq('status', 'active')
      .single();

    if (tenant) {
      const branding = await loadTenantBranding(supabase, tenant.id);
      
      return {
        ...tenant,
        is_default: true,
        branding,
        branding_version: tenant.branding_version,
        branding_updated_at: tenant.branding_updated_at
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
      .select('logo_url, app_name, app_tagline, primary_color, secondary_color, background_color, version')
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
    branding_version: 1,
    branding_updated_at: new Date().toISOString(),
    branding: {
      app_name: 'KisanShakti AI',
      app_tagline: 'Your smart farming journey starts here',
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      background_color: '#FFFFFF',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      version: 1
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
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') ||
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
      // 1. Try comprehensive domain/subdomain detection
      const { tenant, method } = await detectTenantByDomain(supabase, domain);
      
      if (tenant) {
        result = tenant;
        detectionMethod = method;
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
    await auditLog(supabase, domain, clientIP, result.slug, detectionMethod);

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
