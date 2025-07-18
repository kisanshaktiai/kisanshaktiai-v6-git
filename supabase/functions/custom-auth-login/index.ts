
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

    // Find farmer by mobile_number using maybeSingle() to handle multiple matches gracefully
    const { data: farmer, error: fetchError } = await supabase
      .from('farmers')
      .select('id, pin_hash, login_attempts, tenant_id, farmer_code, mobile_number')
      .eq('mobile_number', cleanMobile)
      .order('created_at', { ascending: false }) // Get the most recent if multiple exist
      .limit(1)
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

    // Verify PIN using bcrypt
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
    const isValidPin = await bcrypt.compare(pin, farmer.pin_hash)

    if (!isValidPin) {
      // Increment login attempts
      await supabase
        .from('farmers')
        .update({ login_attempts: (farmer.login_attempts || 0) + 1 })
        .eq('id', farmer.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid PIN' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      tenant_id: farmer.tenant_id, // Can be null
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
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error. Please try again.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
