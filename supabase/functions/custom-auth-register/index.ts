
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
      .select('id')
      .eq('mobile_number', cleanMobile)
      .single()

    if (existingFarmer) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'A farmer with this mobile number already exists' 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash the PIN
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
    const pinHash = await bcrypt.hash(pin, 10)

    // Generate farmer code
    const farmerCode = `F${cleanMobile.substring(6)}_${Date.now().toString(36)}`

    // Create farmer record with only required fields
    const { data: farmer, error: insertError } = await supabase
      .from('farmers')
      .insert([{
        mobile_number: cleanMobile,
        pin_hash: pinHash,
        farmer_code: farmerCode,
        // tenant_id is optional and will be null initially
        app_install_date: new Date().toISOString().split('T')[0],
        ...farmer_data
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create farmer account' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate JWT token
    const jwt = await import('https://deno.land/x/djwt@v3.0.1/mod.ts')
    
    const payload = {
      farmer_id: farmer.id,
      tenant_id: farmer.tenant_id, // Will be null initially
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
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
