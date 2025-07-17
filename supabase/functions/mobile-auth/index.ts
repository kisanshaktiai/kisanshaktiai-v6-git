
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== MOBILE AUTH EDGE FUNCTION START ===');
    
    const { phone, tenantId = 'default', preferredLanguage = 'hi' } = await req.json();
    console.log('Received phone number, tenant, and language:', { phone, tenantId, preferredLanguage });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve tenant ID if it's a slug
    let resolvedTenantId = tenantId;
    if (tenantId === 'default' || !tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('Resolving tenant slug to UUID:', tenantId);
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantId)
        .eq('status', 'active')
        .single();

      if (tenantError || !tenant) {
        console.error('Tenant resolution error:', tenantError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Invalid tenant: ${tenantId}. Please check your configuration.` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      resolvedTenantId = tenant.id;
      console.log('Resolved tenant ID:', resolvedTenantId);
    }

    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('Phone number to search:', cleanPhone);

    if (cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }


    console.log('=== CHECKING FOR EXISTING USER ===');

    // Check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, phone, full_name')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking existing profile:', profileError);
    }

    console.log('Profile check result:', { 
      found: !!existingProfile, 
      profileId: existingProfile?.id,
      storedPhone: existingProfile?.phone
    });

    let authUser;
    let isNewUser = false;

    if (existingProfile) {
      console.log('=== EXISTING USER SIGN IN ===');
      
      // Get the auth user by user ID
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(existingProfile.id);
      
      if (userError || !userData.user) {
        console.error('Error getting auth user:', userError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'User authentication record not found. Please contact support.' 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      authUser = userData.user;
      console.log('Found existing auth user:', authUser.id);

    } else {
      console.log('=== NEW USER CREATION ===');
      isNewUser = true;

      try {
        // Create new user with phone as email (temporary approach)
        const tempEmail = `${cleanPhone}@temp.kisanshakti.app`;
        const tempPassword = `temp_${cleanPhone}_${Date.now()}`;

        const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          phone: `+91${cleanPhone}`,
          phone_confirmed: true,
          email_confirmed: true,
            user_metadata: {
              phone: cleanPhone,
              is_mobile_user: true,
              tenant_id: resolvedTenantId,
              preferred_language: preferredLanguage
            }
        });

        if (createError) {
          console.error('User creation error:', createError);
          
          if (createError.message?.includes('already been registered')) {
            // Try to find the user by email instead
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users?.find(u => 
              u.email === tempEmail || 
              u.phone === `+91${cleanPhone}` ||
              u.user_metadata?.phone === cleanPhone
            );
            
            if (existingUser) {
              authUser = existingUser;
              isNewUser = false;
              console.log('Found existing user by email/phone:', existingUser.id);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        } else {
          authUser = newUserData.user;
          console.log('Created new auth user:', authUser.id);

          // Create user profile
          const { error: profileInsertError } = await supabase
            .from('user_profiles')
            .insert({
              id: authUser.id,
              phone: cleanPhone,
              phone_verified: true,
              preferred_language: preferredLanguage as any,
              country: 'India',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileInsertError) {
            console.error('Error creating profile:', profileInsertError);
            // Don't fail the entire process, profile can be created later
          } else {
            console.log('User profile created successfully');
          }

          // Link user to tenant
          try {
            const { error: tenantLinkError } = await supabase
              .from('user_tenants')
              .insert({
                user_id: authUser.id,
                tenant_id: resolvedTenantId,
                role: 'farmer' as any,
                is_primary: true,
                is_active: true,
                joined_at: new Date().toISOString()
              });

            if (tenantLinkError) {
              console.error('Error linking user to tenant:', tenantLinkError);
              // Don't fail the process
            } else {
              console.log('User linked to tenant successfully');
            }
          } catch (error) {
            console.error('Tenant linking failed:', error);
          }
        }
      } catch (error) {
        console.error('=== MOBILE AUTH ERROR ===');
        console.error('Error details:', error);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create user account. Please try again.' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (!authUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to authenticate user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('=== GENERATING SESSION ===');

    try {
      // Create a proper session using admin API
      console.log('Creating session for user:', authUser.id);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: authUser.id,
        expires_in: 3600 // 1 hour
      });

      if (sessionError || !sessionData.session) {
        console.error('Session creation failed:', sessionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create authentication session. Please try again.' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Session created successfully:', {
        hasAccessToken: !!sessionData.session.access_token,
        hasRefreshToken: !!sessionData.session.refresh_token,
        expiresAt: sessionData.session.expires_at
      });

      // Prepare session response
      const sessionResponse = {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        expires_in: sessionData.session.expires_in || 3600,
        token_type: 'bearer',
        user: sessionData.session.user
      };

      console.log('Session generated successfully for user:', authUser.id);

      return new Response(
        JSON.stringify({
          success: true,
          user: authUser,
          session: sessionResponse,
          isNewUser,
          message: isNewUser ? 'Account created successfully' : 'Welcome back!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (sessionGenerationError) {
      console.error('Session generation failed:', sessionGenerationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate session. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('=== MOBILE AUTH CRITICAL ERROR ===');
    console.error('Critical error in mobile auth:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Authentication service temporarily unavailable. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
