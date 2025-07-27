
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    console.log('Received request:', { phone: phone?.replace(/\d/g, '*'), checkOnly })

    if (!phone || typeof phone !== 'string' || phone.length !== 10) {
      console.log('Invalid phone number provided:', phone?.length, 'digits')
      return new Response(
        JSON.stringify({ error: 'Valid 10-digit phone number required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean and validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      console.log('Invalid Indian mobile number format:', cleanPhone)
      return new Response(
        JSON.stringify({ error: 'Valid Indian mobile number required (6-9 followed by 9 digits)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== CHECKING FOR EXISTING USER ===')
    console.log('Phone number to search:', cleanPhone.replace(/\d/g, '*'))

    // Check in user_profiles table using correct column name
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, mobile_number, full_name')
      .eq('mobile_number', cleanPhone)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking user_profiles:', profileError)
      return new Response(
        JSON.stringify({ 
          error: 'Database error while checking user profile',
          details: profileError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Profile check result:', {
      found: !!existingProfile,
      profileId: existingProfile?.id,
      storedMobile: existingProfile?.mobile_number?.replace(/\d/g, '*')
    })

    let userExists = !!existingProfile;

    // Also check farmers table if not found in user_profiles
    if (!userExists) {
      console.log('User not found in user_profiles, checking farmers table...')
      
      const { data: existingFarmer, error: farmerError } = await supabaseAdmin
        .from('farmers')
        .select('id, mobile_number')
        .eq('mobile_number', cleanPhone)
        .maybeSingle()

      if (farmerError && farmerError.code !== 'PGRST116') {
        console.error('Error checking farmers table:', farmerError)
        return new Response(
          JSON.stringify({ 
            error: 'Database error while checking farmer data',
            details: farmerError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      userExists = !!existingFarmer;
      console.log('Farmer check result:', {
        found: !!existingFarmer,
        farmerId: existingFarmer?.id,
        storedMobile: existingFarmer?.mobile_number?.replace(/\d/g, '*')
      })
    }

    console.log('=== FINAL USER EXISTS CHECK ===', {
      phone: cleanPhone.replace(/\d/g, '*'),
      userExists,
      foundInProfiles: !!existingProfile,
      checkedFarmers: !existingProfile
    })

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
        profile: existingProfile || null 
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
