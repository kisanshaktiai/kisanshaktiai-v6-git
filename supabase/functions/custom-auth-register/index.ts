
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
    const { mobile_number, pin, tenant_id, farmer_data } = await req.json()

    if (!mobile_number || !pin || !tenant_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number, PIN, and tenant ID are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean mobile number
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

    // Validate PIN (4-6 digits)
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PIN must be 4-6 digits' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if farmer already exists with this mobile number in this tenant
    const { data: existingFarmer } = await supabase
      .from('farmers')
      .select('id, mobile_number')
      .eq('tenant_id', tenant_id)
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

    // Hash PIN using bcrypt
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
    const pinHash = await bcrypt.hash(pin, 12)

    // Generate farmer code
    const farmerCode = `F${tenant_id.slice(0, 8)}${cleanMobile.slice(-4)}`

    // Create farmer record
    const farmerRecord = {
      id: crypto.randomUUID(),
      tenant_id,
      mobile_number: cleanMobile,
      pin_hash: pinHash,
      farmer_code: farmerCode,
      last_login_at: new Date().toISOString(),
      login_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...farmer_data
    }

    const { data: newFarmer, error: insertError } = await supabase
      .from('farmers')
      .insert(farmerRecord)
      .select('id, farmer_code, mobile_number, tenant_id')
      .single()

    if (insertError) {
      console.error('Registration error:', insertError)
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
      farmer_id: newFarmer.id,
      tenant_id: newFarmer.tenant_id,
      mobile_number: newFarmer.mobile_number,
      farmer_code: newFarmer.farmer_code,
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
          id: newFarmer.id,
          farmer_code: newFarmer.farmer_code,
          mobile_number: newFarmer.mobile_number,
          tenant_id: newFarmer.tenant_id
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
