
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { mobile_number, tenantId, preferredLanguage } = await req.json()
    console.log('Mobile auth request for:', mobile_number?.replace(/\d/g, '*'), 'tenant:', tenantId)

    if (!mobile_number) {
      console.error('Mobile number is missing from request')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mobile number is required' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate mobile number format
    const cleanMobile = mobile_number.replace(/\D/g, '')
    if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      console.error('Invalid mobile number format:', cleanMobile.length, 'digits')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Please enter a valid 10-digit Indian mobile number' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user exists in user_profiles
    console.log('Checking if user exists in user_profiles')
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, mobile_number, full_name')
      .eq('mobile_number', cleanMobile)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Database error checking user profile:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error checking user existence' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let isNewUser = !existingProfile
    let userId = existingProfile?.id
    
    console.log('User exists check result:', { isNewUser, userId: userId ? 'found' : 'not found' })

    // Generate temporary email and password for authentication
    const tempEmail = `${cleanMobile}@kisanshakti.temp`
    const tempPassword = `ks_${cleanMobile}_${Math.random().toString(36).slice(2)}`

    if (isNewUser) {
      console.log('Creating new user for mobile:', cleanMobile.replace(/\d/g, '*'))
      
      // Create auth user with proper metadata
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        phone: `+91${cleanMobile}`,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          mobile_number: cleanMobile,
          tenant_id: tenantId,
          preferred_language: preferredLanguage || 'hi'
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create user account: ' + authError.message 
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      userId = authUser.user?.id
      console.log('Auth user created successfully:', userId)

      // Create farmer record if needed
      if (tenantId) {
        const { error: farmerError } = await supabase
          .from('farmers')
          .insert({
            id: userId,
            mobile_number: cleanMobile,
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (farmerError) {
          console.log('Note: Could not create farmer record:', farmerError.message)
          // This is not critical, user can still authenticate
        } else {
          console.log('Farmer record created successfully')
        }
      }

    } else {
      console.log('Existing user found:', userId)
      
      // For existing users, update their password for current session
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId!, {
        password: tempPassword
      })
      
      if (updateError) {
        console.error('Error updating user password:', updateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication setup failed: ' + updateError.message 
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Get tenant information if provided
    let tenant = null
    if (tenantId) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, tenant_branding(logo_url, app_name, app_tagline, primary_color, background_color)')
        .eq('id', tenantId)
        .eq('status', 'active')
        .single()

      if (tenantError) {
        console.log('Warning: Could not fetch tenant data:', tenantError.message)
      } else {
        tenant = {
          id: tenantData.id,
          name: tenantData.name,
          branding: tenantData.tenant_branding?.[0] || {}
        }
      }
    }

    console.log('Authentication successful for user:', userId)

    return new Response(
      JSON.stringify({ 
        success: true,
        isNewUser,
        userId,
        tenantId,
        credentials: {
          email: tempEmail,
          password: tempPassword
        },
        tenant
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mobile-auth:', error)
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
