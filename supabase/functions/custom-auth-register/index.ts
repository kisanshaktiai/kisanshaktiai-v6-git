
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function getDefaultTenant() {
  try {
    console.log('Fetching default tenant from tenant-default endpoint');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/tenant-default`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mobile_number, pin, full_name } = await req.json()

    console.log('=== REGISTRATION START ===')
    console.log('Registration request received:', { 
      mobile_number, 
      hasPin: !!pin,
      full_name,
      timestamp: new Date().toISOString()
    })

    if (!mobile_number || !pin) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number and PIN are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean mobile number (remove any non-digits)
    const cleanMobile = mobile_number.replace(/\D/g, '')
    console.log('Cleaned mobile number:', cleanMobile)
    
    if (cleanMobile.length !== 10) {
      console.error('Invalid mobile number length:', cleanMobile.length)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please enter a valid 10-digit mobile number' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get default tenant dynamically
    const defaultTenant = await getDefaultTenant()
    
    if (!defaultTenant || !defaultTenant.id) {
      console.error('No default tenant available')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'System configuration error. Please contact support.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Using tenant:', defaultTenant)

    // Check if farmer already exists
    console.log('Checking for existing farmer...')
    const { data: existingFarmer, error: checkError } = await supabase
      .from('farmers')
      .select('id, mobile_number, tenant_id')
      .eq('mobile_number', cleanMobile)
      .eq('tenant_id', defaultTenant.id)
      .maybeSingle()

    if (checkError) {
      console.error('Check farmer error:', checkError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error checking existing farmer' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingFarmer) {
      console.log('Farmer already exists:', existingFarmer.id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number already registered. Please try logging in.' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash PIN using the same method as login
    console.log('Hashing PIN...')
    const encoder = new TextEncoder()
    const salt = 'kisan_shakti_pin_salt_2024'
    const data = encoder.encode(pin + salt + cleanMobile)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Generate farmer code
    const farmerCode = `FARMER_${cleanMobile.slice(-6)}_${Date.now().toString().slice(-4)}`
    console.log('Generated farmer code:', farmerCode)

    // Create farmer record with dynamic tenant ID
    console.log('Creating farmer record...')
    const { data: newFarmer, error: farmerError } = await supabase
      .from('farmers')
      .insert({
        mobile_number: cleanMobile,
        pin_hash: pinHash,
        farmer_code: farmerCode,
        tenant_id: defaultTenant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        login_attempts: 0,
        is_verified: false,
        total_app_opens: 1,
        app_install_date: new Date().toISOString().split('T')[0],
        last_app_open: new Date().toISOString()
      })
      .select()
      .single()

    if (farmerError) {
      console.error('Farmer creation error:', farmerError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create farmer account: ' + farmerError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Farmer created successfully:', newFarmer.id)

    // Create user profile record
    console.log('Creating user profile...')
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newFarmer.id, // Use same ID as farmer
        mobile_number: cleanMobile,
        phone_verified: true,
        preferred_language: 'hi',
        full_name: full_name || farmerCode,
        farmer_id: newFarmer.id,
        tenant_id: defaultTenant.id,
        country: 'IN',
        notification_preferences: {
          sms: true,
          push: true,
          email: false,
          whatsapp: true,
          calls: false
        },
        device_tokens: [],
        expertise_areas: [],
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail registration if profile creation fails
      console.log('Continuing without profile...')
    } else {
      console.log('User profile created successfully:', newProfile.id)
    }

    console.log('=== REGISTRATION SUCCESS ===')
    console.log('Registration completed successfully:', {
      farmerId: newFarmer.id,
      farmerCode: newFarmer.farmer_code,
      mobile: newFarmer.mobile_number,
      tenantId: newFarmer.tenant_id,
      profileCreated: !!newProfile,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Registration successful',
        farmer: {
          id: newFarmer.id,
          farmer_code: newFarmer.farmer_code,
          mobile_number: newFarmer.mobile_number,
          tenant_id: newFarmer.tenant_id
        },
        user_profile: newProfile ? {
          id: newProfile.id,
          mobile_number: newProfile.mobile_number,
          preferred_language: newProfile.preferred_language,
          full_name: newProfile.full_name,
          farmer_id: newProfile.farmer_id
        } : null
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===')
    console.error('Registration error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + (error.message || 'Unknown error') 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
