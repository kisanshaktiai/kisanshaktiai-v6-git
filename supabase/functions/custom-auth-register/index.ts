
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const jwtSecret = Deno.env.get('JWT_SECRET') || 'your-jwt-secret'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mobile_number, pin, farmer_data = {} } = await req.json()

    console.log('Registration request received:', { mobile_number, pin_length: pin?.length })

    if (!mobile_number || !pin) {
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
    
    if (cleanMobile.length !== 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please enter a valid 10-digit mobile number' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate PIN is exactly 4 digits
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PIN must be exactly 4 digits' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if farmer already exists with this mobile number
    const { data: existingFarmer } = await supabase
      .from('farmers')
      .select('id, mobile_number')
      .eq('mobile_number', cleanMobile)
      .maybeSingle()

    console.log('Existing farmer check:', existingFarmer)

    if (existingFarmer) {
      console.log('Farmer already exists, returning conflict')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'A farmer with this mobile number already exists' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash the PIN using Web Crypto API
    const encoder = new TextEncoder()
    const salt = 'kisan_shakti_pin_salt_2024'
    const data = encoder.encode(pin + salt + cleanMobile)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Generate unique farmer code
    const timestamp = Date.now().toString(36)
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    const farmerCode = `F${cleanMobile.substring(6)}_${timestamp}_${randomSuffix}`

    // Generate a UUID for the farmer
    const farmerId = crypto.randomUUID()

    console.log('Creating farmer:', { farmerId, farmerCode, cleanMobile })

    // Create farmer record - tenant_id will be null for now
    const { data: farmer, error: insertError } = await supabase
      .from('farmers')
      .insert([{
        id: farmerId,
        mobile_number: cleanMobile,
        pin_hash: pinHash,
        farmer_code: farmerCode,
        tenant_id: null, // Explicitly set to null
        app_install_date: new Date().toISOString().split('T')[0],
        login_attempts: 0,
        is_verified: false,
        farming_experience_years: farmer_data.farming_experience_years || null,
        farm_type: farmer_data.farm_type || null,
        total_land_acres: farmer_data.total_land_acres || null,
        primary_crops: farmer_data.primary_crops || null,
        annual_income_range: farmer_data.annual_income_range || null,
        has_loan: farmer_data.has_loan || false,
        loan_amount: farmer_data.loan_amount || null,
        has_tractor: farmer_data.has_tractor || false,
        has_irrigation: farmer_data.has_irrigation || false,
        irrigation_type: farmer_data.irrigation_type || null,
        has_storage: farmer_data.has_storage || false,
        ...farmer_data
      }])
      .select()
      .single()

    console.log('Insert result:', { farmer, insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      
      // Handle specific constraint violations
      if (insertError.code === '23505') {
        if (insertError.message.includes('farmers_farmer_code_unique')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Registration failed due to code conflict. Please try again.' 
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (insertError.message.includes('farmers_mobile_tenant_unique')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'A farmer with this mobile number already exists' 
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create farmer account. Please try again.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to create user profile, but don't fail if it doesn't work
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: farmerId,
          mobile_number: cleanMobile,
          phone_verified: true,
          preferred_language: farmer_data.preferred_language || 'hi',
          full_name: farmer_data.full_name || farmerCode,
          farmer_id: farmerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail registration if profile creation fails
      }
    } catch (profileErr) {
      console.error('Profile creation failed:', profileErr)
    }

    // Generate JWT token
    const jwt = await import('https://deno.land/x/djwt@v3.0.1/mod.ts')
    
    const payload = {
      farmer_id: farmer.id,
      tenant_id: farmer.tenant_id, // Will be null
      mobile_number: farmer.mobile_number,
      farmer_code: farmer.farmer_code,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = await jwt.create(
      { alg: 'HS256', typ: 'JWT' },
      payload,
      jwtSecret
    )

    console.log('Registration successful, returning farmer data')

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        farmer: {
          id: farmer.id,
          farmer_code: farmer.farmer_code,
          mobile_number: farmer.mobile_number,
          tenant_id: farmer.tenant_id
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error. Please try again.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
