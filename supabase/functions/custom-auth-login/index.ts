
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
    const { mobile_number, pin } = await req.json()

    console.log('Login request received:', { mobile_number, hasPin: !!pin })

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get default tenant ID
    const { data: defaultTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'kisanshakti')
      .single()

    const tenantId = defaultTenant?.id

    if (!tenantId) {
      console.error('No tenant ID found')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'System configuration error. Please contact support.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find farmer by mobile_number and tenant_id
    const { data: farmer, error: fetchError } = await supabase
      .from('farmers')
      .select('id, pin_hash, login_attempts, tenant_id, farmer_code, mobile_number')
      .eq('mobile_number', cleanMobile)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch farmer error:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error finding farmer account' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!farmer) {
      console.log('No farmer found with mobile:', cleanMobile)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No account found with this mobile number' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if account is locked (optional security feature)
    if (farmer.login_attempts >= 5) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Account temporarily locked due to too many failed attempts. Please contact support.' 
        }),
        { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify PIN using the same hashing method as registration
    const encoder = new TextEncoder()
    const salt = 'kisan_shakti_pin_salt_2024'
    const data = encoder.encode(pin + salt + cleanMobile)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    const isValidPin = computedHash === farmer.pin_hash

    if (!isValidPin) {
      // Increment login attempts
      await supabase
        .from('farmers')
        .update({ login_attempts: (farmer.login_attempts || 0) + 1 })
        .eq('id', farmer.id)

      console.log('Invalid PIN attempt for farmer:', farmer.id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid PIN' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user profile exists, create if missing
    let { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', farmer.id)
      .maybeSingle()

    if (!userProfile) {
      console.log('User profile missing for farmer:', farmer.id, 'Creating...')
      
      // Create missing user profile
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: farmer.id,
          mobile_number: cleanMobile,
          phone_verified: true,
          preferred_language: 'hi',
          full_name: farmer.farmer_code,
          farmer_id: farmer.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
        // Continue with login even if profile creation fails
      } else {
        userProfile = newProfile
        console.log('User profile created successfully:', userProfile.id)
      }
    }

    // Reset login attempts and update last login
    await supabase
      .from('farmers')
      .update({ 
        login_attempts: 0,
        last_login_at: new Date().toISOString(),
        total_app_opens: (farmer.total_app_opens || 0) + 1,
        last_app_open: new Date().toISOString()
      })
      .eq('id', farmer.id)

    // Generate JWT token
    const jwt = await import('https://deno.land/x/djwt@v3.0.1/mod.ts')
    
    const payload = {
      farmer_id: farmer.id,
      tenant_id: farmer.tenant_id,
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

    console.log('Login successful for farmer:', farmer.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        farmer: {
          id: farmer.id,
          farmer_code: farmer.farmer_code,
          mobile_number: farmer.mobile_number,
          tenant_id: farmer.tenant_id
        },
        user_profile: userProfile ? {
          id: userProfile.id,
          mobile_number: userProfile.mobile_number,
          preferred_language: userProfile.preferred_language
        } : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + (error.message || 'Unknown error') 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
