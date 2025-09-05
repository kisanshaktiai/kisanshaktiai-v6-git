import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { action, mobile_number, pin, tenant_id, full_name, location, preferred_language, old_pin, new_pin, otp } = body
    
    console.log('Mobile auth PIN request:', { 
      action, 
      mobile: mobile_number?.replace(/\d/g, '*'), 
      tenant: tenant_id 
    })

    // Validate mobile number
    const cleanMobile = mobile_number?.replace(/\D/g, '')
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid mobile number format' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    switch (action) {
      case 'register':
        return await handleRegistration(supabase, {
          mobile_number: cleanMobile,
          pin,
          tenant_id,
          full_name,
          location,
          preferred_language
        })

      case 'login':
        return await handleLogin(supabase, {
          mobile_number: cleanMobile,
          pin
        })

      case 'update_pin':
        return await handleUpdatePin(supabase, {
          mobile_number: cleanMobile,
          old_pin,
          new_pin
        })

      case 'reset_pin':
        return await handleResetPin(supabase, {
          mobile_number: cleanMobile,
          otp,
          new_pin
        })

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid action' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Error in mobile-auth-pin:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleRegistration(supabase: any, params: any) {
  const { mobile_number, pin, tenant_id, full_name, location, preferred_language } = params

  try {
    // Validate PIN
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PIN must be exactly 6 digits' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('mobile_number', mobile_number)
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number already registered' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate tenant exists and is active
    if (tenant_id) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, status')
        .eq('id', tenant_id)
        .eq('status', 'active')
        .single()

      if (tenantError || !tenant) {
        console.error('Invalid tenant:', tenantError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid or inactive tenant' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin)

    // Generate temporary credentials for Supabase Auth
    const tempEmail = `${mobile_number}@kisanshakti.farmer`
    const tempPassword = `ks_${mobile_number}_${Math.random().toString(36).slice(2)}`

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      phone: `+91${mobile_number}`,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        mobile_number: mobile_number,
        full_name: full_name || 'Farmer',
        tenant_id: tenant_id,
        preferred_language: preferred_language || 'hi'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create user account' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = authUser.user?.id
    console.log('Auth user created:', userId)

    // Store PIN hash in farmers table
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .insert({
        id: userId,
        mobile_number: mobile_number,
        pin_hash: pinHash,
        tenant_id: tenant_id,
        full_name: full_name || 'Farmer',
        location: location || {},
        preferred_language: preferred_language || 'hi',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (farmerError) {
      console.error('Error creating farmer record:', farmerError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(userId)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create farmer profile' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user-tenant association
    if (tenant_id) {
      await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: tenant_id,
          role: 'farmer',
          is_active: true,
          created_at: new Date().toISOString()
        })
    }

    console.log('Registration successful for:', mobile_number.replace(/\d/g, '*'))

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: userId,
        tenantId: tenant_id,
        farmer: farmer,
        credentials: {
          email: tempEmail,
          password: tempPassword
        }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Registration failed: ' + error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleLogin(supabase: any, params: any) {
  const { mobile_number, pin } = params

  try {
    // Validate PIN format
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid PIN format' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get farmer with PIN hash
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select(`
        *,
        tenant:tenants(
          id,
          name,
          slug,
          status,
          tenant_branding(*)
        )
      `)
      .eq('mobile_number', mobile_number)
      .eq('is_active', true)
      .single()

    if (farmerError || !farmer) {
      console.error('Farmer not found:', farmerError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid mobile number or PIN' 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, farmer.pin_hash)
    
    if (!isPinValid) {
      console.log('Invalid PIN for mobile:', mobile_number.replace(/\d/g, '*'))
      
      // Increment failed attempts
      await supabase
        .from('farmers')
        .update({ 
          failed_login_attempts: (farmer.failed_login_attempts || 0) + 1,
          last_failed_login: new Date().toISOString()
        })
        .eq('id', farmer.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid mobile number or PIN' 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if tenant is active
    if (farmer.tenant && farmer.tenant.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Your tenant account is not active. Please contact support.' 
        }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate new temporary password for this session
    const tempEmail = `${mobile_number}@kisanshakti.farmer`
    const tempPassword = `ks_${mobile_number}_${Math.random().toString(36).slice(2)}`

    // Update auth user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(farmer.id, {
      password: tempPassword
    })

    if (updateError) {
      console.error('Error updating auth password:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update last login and reset failed attempts
    await supabase
      .from('farmers')
      .update({ 
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', farmer.id)

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', farmer.id)
      .single()

    console.log('Login successful for:', mobile_number.replace(/\d/g, '*'))

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: farmer.id,
        tenantId: farmer.tenant_id,
        farmer: {
          ...farmer,
          pin_hash: undefined // Don't send PIN hash to client
        },
        profile: profile,
        credentials: {
          email: tempEmail,
          password: tempPassword
        }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Login failed: ' + error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUpdatePin(supabase: any, params: any) {
  const { mobile_number, old_pin, new_pin } = params

  try {
    // Validate PINs
    if (!old_pin || !new_pin || old_pin.length !== 6 || new_pin.length !== 6) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Both old and new PIN must be exactly 6 digits' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get farmer
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('id, pin_hash')
      .eq('mobile_number', mobile_number)
      .eq('is_active', true)
      .single()

    if (farmerError || !farmer) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify old PIN
    const isOldPinValid = await bcrypt.compare(old_pin, farmer.pin_hash)
    
    if (!isOldPinValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Current PIN is incorrect' 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(new_pin)

    // Update PIN hash
    const { error: updateError } = await supabase
      .from('farmers')
      .update({ 
        pin_hash: newPinHash,
        pin_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', farmer.id)

    if (updateError) {
      console.error('Error updating PIN:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update PIN' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('PIN updated for:', mobile_number.replace(/\d/g, '*'))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PIN updated successfully'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Update PIN error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to update PIN: ' + error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleResetPin(supabase: any, params: any) {
  const { mobile_number, otp, new_pin } = params

  try {
    // Validate inputs
    if (!otp || !new_pin || new_pin.length !== 6) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid OTP or PIN format' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify OTP (implement OTP verification logic)
    // This is a placeholder - implement actual OTP verification
    console.log('OTP verification for PIN reset:', { mobile: mobile_number.replace(/\d/g, '*'), otp })

    // Get farmer
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('id')
      .eq('mobile_number', mobile_number)
      .single()

    if (farmerError || !farmer) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(new_pin)

    // Update PIN hash
    const { error: updateError } = await supabase
      .from('farmers')
      .update({ 
        pin_hash: newPinHash,
        pin_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', farmer.id)

    if (updateError) {
      console.error('Error resetting PIN:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to reset PIN' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('PIN reset for:', mobile_number.replace(/\d/g, '*'))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PIN reset successfully'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Reset PIN error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to reset PIN: ' + error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}