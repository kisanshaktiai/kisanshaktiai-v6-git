
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user profile
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get farmer profile
    const { data: farmerProfile } = await supabaseClient
      .from('farmers')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get user tenants
    const { data: userTenants } = await supabaseClient
      .from('user_tenants')
      .select(`
        tenant_id,
        role,
        is_active,
        tenants!inner(
          name,
          slug,
          subscription_plan
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    const profileData = {
      user: userProfile,
      farmer: farmerProfile,
      tenants: userTenants?.map(ut => ({
        id: ut.tenant_id,
        role: ut.role,
        tenant: ut.tenants
      })) || [],
      isComplete: !!(userProfile?.full_name && farmerProfile?.mobile_number),
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(profileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Farmer profile error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
