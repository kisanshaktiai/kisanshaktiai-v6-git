
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
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, mobile_number, full_name')
      .eq('mobile_number', cleanMobile)
      .single()

    let isNewUser = !existingProfile
    let userId = existingProfile?.id
    
    // Generate temporary email and password for authentication
    const tempEmail = `${cleanMobile}@kisanshakti.temp`
    const tempPassword = `ks_${cleanMobile}_${Math.random().toString(36).slice(2)}`

    if (isNewUser) {
      console.log('Creating new user for mobile:', cleanMobile.replace(/\d/g, '*'))
      
      // Create auth user
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
            error: 'Failed to create user account' 
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      userId = authUser.user?.id

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          mobile_number: cleanMobile,
          preferred_language: preferredLanguage || 'hi',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userId!)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create user profile' 
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create farmer record if needed
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
        console.log('Note: Could not create farmer record:', farmerError)
        // This is not critical, user can still authenticate
      }

    } else {
      console.log('Existing user found:', userId)
      
      // For existing users, we need to get their auth record
      const { data: authUser } = await supabase.auth.admin.getUserById(userId!)
      
      if (authUser.user) {
        // Update the password for existing user
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId!, {
          password: tempPassword
        })
        
        if (updateError) {
          console.error('Error updating user password:', updateError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Authentication setup failed' 
            }), 
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
    }

    // Get tenant information
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, tenant_branding(logo_url, app_name, app_tagline, primary_color, background_color)')
      .eq('id', tenantId)
      .eq('status', 'active')
      .single()

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
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          branding: tenant.tenant_branding?.[0] || {}
        } : null
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mobile-auth:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
