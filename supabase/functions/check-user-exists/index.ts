
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mobile_number } = await req.json()

    if (!mobile_number) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean mobile number (remove any non-digits)
    const cleanMobile = mobile_number.replace(/\D/g, '')
    
    if (cleanMobile.length !== 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please enter a valid 10-digit mobile number' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user exists in farmers table
    const { data: farmerData } = await supabase
      .from('farmers')
      .select('id, farmer_code, mobile_number, tenant_id, is_verified')
      .eq('mobile_number', cleanMobile)
      .maybeSingle()

    // Check if user exists in user_profiles table
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('id, full_name, mobile_number, is_profile_complete, tenant_id')
      .eq('mobile_number', cleanMobile)
      .maybeSingle()

    const userExists = !!(farmerData || profileData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        exists: userExists,
        farmer: farmerData,
        profile: profileData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Check user exists error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error. Please try again.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
