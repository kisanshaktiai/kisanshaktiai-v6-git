
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { mobile_number } = await req.json()
    console.log('Mobile auth request for:', mobile_number)

    if (!mobile_number) {
      return new Response(
        JSON.stringify({ error: 'Mobile number is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user exists in user_profiles
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, mobile_number, full_name')
      .eq('mobile_number', mobile_number)
      .single()

    if (existingProfile) {
      console.log('Existing user found:', existingProfile.id)
      return new Response(
        JSON.stringify({ 
          exists: true, 
          user_id: existingProfile.id,
          profile: existingProfile
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get default tenant ID for new users
    const { data: defaultTenant } = await supabase
      .from('tenants')
      .select('id, name, tenant_branding(logo_url, app_name, app_tagline, primary_color, background_color)')
      .eq('is_default', true)
      .eq('status', 'active')
      .single()

    console.log('Default tenant for new user:', defaultTenant?.id)

    return new Response(
      JSON.stringify({ 
        exists: false,
        default_tenant: defaultTenant ? {
          id: defaultTenant.id,
          name: defaultTenant.name,
          branding: defaultTenant.tenant_branding?.[0] || {}
        } : null
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mobile-auth:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
