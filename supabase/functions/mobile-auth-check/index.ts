
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getDefaultTenant(supabaseAdmin: any) {
  try {
    console.log('Fetching default tenant from tenant-default endpoint');
    
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/tenant-default`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch default tenant:', response.status, response.statusText);
      return null;
    }

    const tenantData = await response.json();
    console.log('Default tenant fetched successfully:', tenantData);
    
    return {
      id: tenantData.id,
      name: tenantData.name
    };
  } catch (error) {
    console.error('Error fetching default tenant:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== MOBILE AUTH CHECK FUNCTION START ===')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { phone, checkOnly } = requestBody;
    console.log('Received request:', { phone, checkOnly })

    if (!phone || typeof phone !== 'string' || phone.length !== 10) {
      console.log('Invalid phone number provided')
      return new Response(
        JSON.stringify({ error: 'Valid 10-digit phone number required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get default tenant dynamically
    const defaultTenant = await getDefaultTenant(supabaseAdmin);
    
    if (!defaultTenant || !defaultTenant.id) {
      console.error('No default tenant available')
      return new Response(
        JSON.stringify({ 
          error: 'System configuration error. Please contact support.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Using tenant:', defaultTenant)

    console.log('=== CHECKING FOR EXISTING USER ===')
    console.log('Phone number to search:', phone)

    // Check in farmers table with dynamic tenant ID
    const { data: existingFarmer, error: farmerError } = await supabaseAdmin
      .from('farmers')
      .select('id, mobile_number, tenant_id, farmer_code')
      .eq('mobile_number', phone)
      .eq('tenant_id', defaultTenant.id)
      .maybeSingle()

    if (farmerError && farmerError.code !== 'PGRST116') {
      console.error('Error checking for existing farmer:', farmerError)
      return new Response(
        JSON.stringify({ 
          error: 'Database error while checking user',
          details: farmerError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Farmer check result:', {
      found: !!existingFarmer,
      farmerId: existingFarmer?.id,
      farmerCode: existingFarmer?.farmer_code,
      tenantId: existingFarmer?.tenant_id
    })

    const userExists = !!existingFarmer

    // If this is just a check, return the result
    if (checkOnly) {
      return new Response(
        JSON.stringify({ userExists }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        userExists, 
        farmer: existingFarmer,
        tenantId: defaultTenant.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== MOBILE AUTH CHECK ERROR ===')
    console.error('Error details:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Check failed',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
