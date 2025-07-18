
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
    console.log('Received request:', { phone: phone?.slice(-4), tenantId, preferredLanguage });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      console.error('Invalid phone number length:', cleanPhone.length);
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid 10-digit mobile number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the known default tenant ID for KisanShakti AI
    const defaultTenantId = '66372c6f-c996-4425-8749-a7561e5d6ae3';
    let resolvedTenantId = defaultTenantId;

    // Only try to resolve if it's not the default
    if (tenantId !== 'default' && tenantId !== defaultTenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantId)
        .eq('status', 'active')
        .maybeSingle();

      if (tenant) {
        resolvedTenantId = tenant.id;
      }
    }

    console.log('Using tenant ID:', resolvedTenantId);

    // Check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, phone, full_name')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (profileError) {
      console.error('Profile check error:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authUser;
    let isNewUser = false;

    if (existingProfile) {
      console.log('Existing user found:', existingProfile.id);
      
      // Get the auth user by user ID
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(existingProfile.id);
      
      if (userError || !userData.user) {
        console.error('Auth user not found:', userError);
        return new Response(
          JSON.stringify({ success: false, error: 'Account not found. Please contact support.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = userData.user;
    }

    // For new users, create them and return credentials
    let tempPassword;
    if (!existingProfile) {
      console.log('Creating new user');
      isNewUser = true;

      // Create new user with farmer email format
      const farmerEmail = `farmer.${cleanPhone}@kisanshaktiai.com`;
      tempPassword = `auto_${cleanPhone}_${Date.now()}`;

      const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
        email: farmerEmail,
        password: tempPassword,
        phone: `+91${cleanPhone}`,
        phone_confirmed: true,
        email_confirmed: true,
        user_metadata: {
          phone: cleanPhone,
          is_mobile_user: true,
          tenant_id: resolvedTenantId,
          preferred_language: preferredLanguage,
          farmer_email: farmerEmail
        }
      });

      if (createError) {
        console.error('User creation error:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create account. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = newUserData.user;

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
        console.error('Profile creation error:', profileInsertError);
        // Continue anyway, profile can be created later
      }

      // Create farmer profile automatically
      const { error: farmerInsertError } = await supabase
        .from('farmers')
        .insert({
          id: authUser.id,
          tenant_id: resolvedTenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (farmerInsertError) {
        console.error('Farmer profile creation error:', farmerInsertError);
        // Continue anyway
      }

      // Link user to tenant
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
        console.error('Tenant linking error:', tenantLinkError);
        // Continue anyway
      }
    }

    console.log('User setup complete, returning credentials for frontend sign-in');

    // For existing users, generate a new temporary password and update it
    if (!isNewUser) {
      const farmerEmail = `farmer.${cleanPhone}@kisanshaktiai.com`;
      const newTempPassword = `auto_${cleanPhone}_${Date.now()}`;
      
      // Update the existing user's password so frontend can sign in
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: newTempPassword
      });
      
      if (updateError) {
        console.error('Failed to update user password:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: authUser.id,
            email: farmerEmail,
            phone: authUser.phone
          },
          credentials: {
            email: farmerEmail,
            password: newTempPassword
          },
          isNewUser: false,
          tenantId: resolvedTenantId,
          message: 'Welcome back!'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For new users, return credentials for frontend sign-in
    const farmerEmail = `farmer.${cleanPhone}@kisanshaktiai.com`;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authUser.id,
          email: farmerEmail,
          phone: authUser.phone
        },
        credentials: {
          email: farmerEmail,
          password: tempPassword
        },
        isNewUser: true,
        tenantId: resolvedTenantId,
        message: 'Welcome to KisanShakti AI!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Service temporarily unavailable. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
