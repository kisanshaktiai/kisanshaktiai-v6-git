
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
    console.log('=== MOBILE AUTH EDGE FUNCTION START ===')
    
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
        JSON.stringify({ 
          success: false,
          error: 'Invalid request format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { phone, tenantId = 'default' } = requestBody;
    console.log('Received phone number and tenant:', { phone, tenantId });

    if (!phone || typeof phone !== 'string' || phone.length !== 10) {
      console.log('Invalid phone number provided to edge function')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Valid 10-digit phone number required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== CHECKING FOR EXISTING USER ===')
    console.log('Phone number to search:', phone)

    // Check in user_profiles table
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, phone, full_name')
      .eq('phone', phone)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Database error while checking user',
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
      storedPhone: existingProfile?.phone
    })

    const email = `farmer.${phone}@kisanshakti.com`
    const password = `kisan_${phone}`
    let userId = null
    let isNewUser = false

    if (existingProfile) {
      console.log('=== EXISTING USER AUTHENTICATION ===')
      userId = existingProfile.id

      // Check if auth user exists for this profile
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (authUserError || !authUser.user) {
        console.log('Auth user not found, creating auth entry for existing profile...')
        
        // Create auth user for existing profile
        const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          id: userId,
          email,
          password: password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { phone, email, tenantId }
        })

        if (createAuthError) {
          console.error('Error creating auth user for existing profile:', createAuthError)
          if (createAuthError.message?.includes('duplicate') || createAuthError.message?.includes('already exists')) {
            // Try to find existing user by email
            const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingAuthUsers.users?.find(user => user.email === email)
            if (existingUser) {
              userId = existingUser.id
              // Update password for existing auth user
              await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { phone, email, tenantId }
              })
            } else {
              throw createAuthError
            }
          } else {
            throw createAuthError
          }
        }
      } else {
        console.log('Auth user exists, updating password and metadata...')
        // Update password and metadata for existing auth user
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: password,
          email_confirm: true,
          user_metadata: { phone, email, tenantId }
        })
      }
    } else {
      console.log('=== NEW USER CREATION ===')
      isNewUser = true
      
      // Create new auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, email, tenantId }
      })

      if (createError) {
        console.error('User creation error:', createError)
        if (createError.message?.includes('duplicate') || createError.message?.includes('already exists')) {
          // Try to find existing user by email
          const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = existingAuthUsers.users?.find(user => user.email === email)
          if (existingUser) {
            userId = existingUser.id
            isNewUser = false
            // Update password for existing auth user
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: password,
              email_confirm: true,
              user_metadata: { phone, email, tenantId }
            })
          } else {
            throw createError
          }
        } else {
          throw createError
        }
      } else {
        userId = newUser.user.id
        console.log('New user created successfully:', userId)

        // Create profile for new user
        const { error: profileCreateError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: userId,
            phone: phone,
            preferred_language: 'hi',
            country: 'India',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileCreateError) {
          console.error('Error creating profile:', profileCreateError)
        }

        // Create tenant association for new user if tenantId is provided and not default
        if (tenantId && tenantId !== 'default') {
          const { error: tenantAssocError } = await supabaseAdmin
            .from('user_tenants')
            .insert({
              user_id: userId,
              tenant_id: tenantId,
              role: 'farmer',
              is_primary: true,
              is_active: true,
              joined_at: new Date().toISOString()
            })

          if (tenantAssocError) {
            console.error('Error creating tenant association:', tenantAssocError)
          }
        }
      }
    }

    // Sign in with password using anon client
    console.log('=== SIGNING IN USER ===')
    console.log('Attempting sign in with email:', email)
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (authError) {
      console.error('Sign-in failed:', authError.message)
      
      if (authError.message.includes('Email not confirmed')) {
        console.log('Email not confirmed, attempting to confirm...')
        await supabaseAdmin.auth.admin.updateUserById(userId!, {
          email_confirm: true
        })
        
        // Retry sign in
        const { data: retryAuthData, error: retryAuthError } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        })
        
        if (retryAuthError) {
          throw retryAuthError
        }
        
        Object.assign(authData, retryAuthData)
      } else {
        throw authError
      }
    }

    if (!authData.session) {
      console.error('No session returned from sign-in')
      throw new Error('Failed to create session during sign-in')
    }

    console.log('=== AUTHENTICATION SUCCESS ===')
    console.log('Session created successfully:', {
      hasAccessToken: !!authData.session.access_token,
      hasRefreshToken: !!authData.session.refresh_token,
      userId: authData.user?.id,
      expiresAt: authData.session.expires_at,
      userEmail: authData.user?.email
    })

    const sessionResponse = {
      success: true,
      isNewUser,
      session: authData.session,
      user: authData.user,
      tenantId,
      debugInfo: {
        phoneSearched: phone,
        foundExistingProfile: !!existingProfile,
        profileId: existingProfile?.id,
        storedPhone: existingProfile?.phone,
        authUserId: authData.user?.id
      }
    }

    console.log('=== RETURNING SUCCESS RESPONSE ===')
    console.log('Response summary:', {
      success: sessionResponse.success,
      isNewUser: sessionResponse.isNewUser,
      userId: sessionResponse.user?.id,
      tenantId: sessionResponse.tenantId
    })

    return new Response(
      JSON.stringify(sessionResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== MOBILE AUTH ERROR ===')
    console.error('Error details:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Authentication failed',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
