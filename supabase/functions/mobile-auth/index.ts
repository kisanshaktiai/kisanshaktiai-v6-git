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

    // Create anon client for authentication
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

    const { phone } = await req.json()
    console.log('Received phone number in edge function:', phone)

    if (!phone || phone.length !== 10) {
      console.log('Invalid phone number provided to edge function')
      return new Response(
        JSON.stringify({ error: 'Valid 10-digit phone number required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== CHECKING FOR EXISTING USER ===')
    console.log('Phone number to search:', phone)

    // Enhanced query to check user_profiles table
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, phone, full_name')
      .eq('phone', phone)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking for existing profile:', profileError)
    }

    console.log('Profile check result:', {
      found: !!existingProfile,
      profileId: existingProfile?.id,
      storedPhone: existingProfile?.phone
    })

    const email = `farmer.${phone}@kisanshakti.com`
    const password = `kisan_${phone}`
    let userId = null

    if (existingProfile) {
      console.log('=== EXISTING USER AUTHENTICATION ===')
      console.log('Found existing user:', existingProfile)
      userId = existingProfile.id

      // Check if auth user exists for this profile
      console.log('Checking auth.users for existing profile...')
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (authUserError || !authUser.user) {
        console.log('Auth user not found, creating auth entry for existing profile...')
        // Create auth user for existing profile
        const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          id: userId, // Use existing profile ID
          email,
          password: password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { phone, email }
        })

        if (createAuthError) {
          console.error('Error creating auth user for existing profile:', createAuthError)
          throw createAuthError
        }
        console.log('Auth user created for existing profile:', newAuthUser.user.id)
      } else {
        console.log('Auth user already exists, updating password...')
        // Update password for existing auth user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: password,
          user_metadata: { phone, email }
        })

        if (updateError) {
          console.error('Error updating existing user:', updateError)
          throw updateError
        }
      }
    } else {
      console.log('=== NEW USER CREATION ===')
      console.log('No existing profile found, creating new user...')
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, email }
      })

      if (createError) {
        console.error('User creation error:', createError)
        throw createError
      }

      console.log('New user created successfully:', newUser.user.id)
      userId = newUser.user.id

      // Create profile for new user
      const { error: profileCreateError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: userId,
          phone: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileCreateError) {
        console.error('Error creating profile:', profileCreateError)
        // Don't fail the auth if profile creation fails
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
      throw authError
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

    // Return complete session response
    const sessionResponse = {
      success: true,
      isNewUser: !existingProfile,
      session: authData.session,
      user: authData.user,
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
      debugInfo: sessionResponse.debugInfo
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