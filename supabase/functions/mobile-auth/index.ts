
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

// Input validation functions
function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  // Indian mobile number validation (starts with 6-9)
  if (!cleanPhone.match(/^[6-9]\d{9}$/)) {
    return { isValid: false, error: 'Invalid Indian mobile number format' };
  }
  
  return { isValid: true };
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>\"'&]/g, '').trim();
}

function getClientInfo(req: Request) {
  return {
    ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SECURE MOBILE AUTH START ===');
    
    const { phone, tenantId = 'default', preferredLanguage = 'hi' } = await req.json();
    const clientInfo = getClientInfo(req);
    
    console.log('Auth attempt:', { 
      phone: phone?.slice(-4), 
      tenantId, 
      preferredLanguage,
      ip: clientInfo.ip
    });

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      console.error('Phone validation failed:', phoneValidation.error);
      return new Response(
        JSON.stringify({ success: false, error: phoneValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limiting
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_auth_rate_limit', { phone_number: cleanPhone });
    
    if (rateLimitError || !rateLimitCheck) {
      console.error('Rate limit check failed:', rateLimitError);
      await supabase.rpc('log_auth_attempt', {
        p_phone_number: cleanPhone,
        p_ip_address: clientInfo.ip,
        p_user_agent: clientInfo.userAgent,
        p_attempt_type: 'rate_limit_exceeded',
        p_success: false
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many authentication attempts. Please try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedTenantId = sanitizeInput(tenantId);
    const sanitizedLanguage = sanitizeInput(preferredLanguage);
    
    // Use environment variable for default tenant ID instead of hardcoded value
    const defaultTenantId = Deno.env.get('DEFAULT_TENANT_ID') || '66372c6f-c996-4425-8749-a7561e5d6ae3';
    let resolvedTenantId = defaultTenantId;

    if (sanitizedTenantId !== 'default' && sanitizedTenantId !== defaultTenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', sanitizedTenantId)
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
      await supabase.rpc('log_auth_attempt', {
        p_phone_number: cleanPhone,
        p_ip_address: clientInfo.ip,
        p_user_agent: clientInfo.userAgent,
        p_attempt_type: 'login',
        p_success: false
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Database error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authUser;
    let isNewUser = false;

    if (existingProfile) {
      console.log('Existing user found:', existingProfile.id);
      
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(existingProfile.id);
      
      if (userError || !userData.user) {
        console.error('Auth user not found:', userError);
        await supabase.rpc('log_auth_attempt', {
          p_phone_number: cleanPhone,
          p_ip_address: clientInfo.ip,
          p_user_agent: clientInfo.userAgent,
          p_attempt_type: 'login',
          p_success: false
        });
        
        return new Response(
          JSON.stringify({ success: false, error: 'Account not found. Please contact support.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = userData.user;
    }

    // Generate secure password using database function
    const { data: securePassword, error: passwordError } = await supabase
      .rpc('generate_secure_password', { length: 32 });
    
    if (passwordError || !securePassword) {
      console.error('Password generation failed:', passwordError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication system error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tempPassword = securePassword;

    if (!existingProfile) {
      console.log('Creating new user');
      isNewUser = true;

      const farmerEmail = `farmer.${cleanPhone}@kisanshaktiai.com`;

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
          preferred_language: sanitizedLanguage,
          farmer_email: farmerEmail
        }
      });

      if (createError) {
        console.error('User creation error:', createError);
        await supabase.rpc('log_auth_attempt', {
          p_phone_number: cleanPhone,
          p_ip_address: clientInfo.ip,
          p_user_agent: clientInfo.userAgent,
          p_attempt_type: 'signup',
          p_success: false
        });
        
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
          preferred_language: sanitizedLanguage as any,
          country: 'India',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileInsertError) {
        console.error('Profile creation error:', profileInsertError);
      }

      // Create farmer profile
      const { error: farmerInsertError } = await supabase
        .from('farmers')
        .insert({
          id: authUser.id,
          tenant_id: resolvedTenantId,
          mobile_number: cleanPhone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (farmerInsertError) {
        console.error('Farmer profile creation error:', farmerInsertError);
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
      }
    } else {
      // For existing users, update password securely
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: tempPassword
      });
      
      if (updateError) {
        console.error('Failed to update user password:', updateError);
        await supabase.rpc('log_auth_attempt', {
          p_phone_number: cleanPhone,
          p_ip_address: clientInfo.ip,
          p_user_agent: clientInfo.userAgent,
          p_attempt_type: 'login',
          p_success: false
        });
        
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log successful authentication attempt
    await supabase.rpc('log_auth_attempt', {
      p_phone_number: cleanPhone,
      p_ip_address: clientInfo.ip,
      p_user_agent: clientInfo.userAgent,
      p_attempt_type: isNewUser ? 'signup' : 'login',
      p_success: true
    });

    console.log('Authentication successful');

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
        isNewUser,
        tenantId: resolvedTenantId,
        message: isNewUser ? 'Welcome to KisanShakti AI!' : 'Welcome back!'
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
