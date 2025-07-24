
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

// Secure token validation with enhanced checks
function validateJWTStructure(token: string): { isValid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT structure' };
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    
    if (!payload.exp || payload.exp <= now) {
      return { isValid: false, error: 'Token expired' };
    }
    
    if (!payload.sub) {
      return { isValid: false, error: 'Missing subject' };
    }
    
    // Check token age (reject tokens older than 24 hours)
    if (payload.iat && (now - payload.iat) > 86400) {
      return { isValid: false, error: 'Token too old' };
    }
    
    return { isValid: true, payload };
  } catch (error) {
    return { isValid: false, error: 'Token parsing failed' };
  }
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SECURE SESSION VALIDATION ===');
    
    const { access_token, refresh_token, user_id } = await req.json();
    const clientInfo = {
      ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    };

    if (!access_token || !refresh_token) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Missing required tokens' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Validating session tokens...');

    // Enhanced JWT validation
    const accessTokenValidation = validateJWTStructure(access_token);
    const refreshTokenValidation = validateJWTStructure(refresh_token);

    console.log('Token validation:', {
      accessTokenValid: accessTokenValidation.isValid,
      refreshTokenValid: refreshTokenValidation.isValid,
      accessError: accessTokenValidation.error,
      refreshError: refreshTokenValidation.error
    });

    let sessionValid = false;
    let userValid = false;
    let sessionTracked = false;
    
    if (accessTokenValidation.isValid && refreshTokenValidation.isValid) {
      try {
        // Create a temporary client with the provided session
        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
        
        const { data, error } = await userClient.auth.setSession({
          access_token,
          refresh_token
        });

        if (!error && data.session && data.user) {
          sessionValid = true;
          
          // Verify user exists and is active
          if (user_id) {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('id, phone, is_active')
              .eq('id', user_id)
              .maybeSingle();
            
            userValid = !!profile && !profileError && (profile.is_active !== false);
          } else {
            userValid = true;
          }

          // Track session securely
          if (userValid && data.session) {
            try {
              const accessTokenHash = await hashToken(access_token);
              const refreshTokenHash = await hashToken(refresh_token);
              
              await supabase
                .from('user_sessions')
                .upsert({
                  user_id: data.user.id,
                  session_id: accessTokenHash.substring(0, 16),
                  access_token_hash: accessTokenHash,
                  refresh_token_hash: refreshTokenHash,
                  expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
                  device_info: {
                    userAgent: clientInfo.userAgent,
                    lastValidated: new Date().toISOString()
                  },
                  ip_address: clientInfo.ip,
                  is_active: true,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id,session_id'
                });
              
              sessionTracked = true;
            } catch (trackingError) {
              console.error('Session tracking error:', trackingError);
              // Don't fail validation due to tracking error
            }
          }
        }
      } catch (error) {
        console.error('Session verification error:', error);
      }
    }

    const result = {
      valid: accessTokenValidation.isValid && refreshTokenValidation.isValid && sessionValid && userValid,
      checks: {
        access_token_valid: accessTokenValidation.isValid,
        refresh_token_valid: refreshTokenValidation.isValid,
        session_valid: sessionValid,
        user_valid: userValid,
        session_tracked: sessionTracked
      },
      errors: {
        access_token_error: accessTokenValidation.error,
        refresh_token_error: refreshTokenValidation.error
      },
      timestamp: new Date().toISOString()
    };

    console.log('Session validation result:', {
      valid: result.valid,
      checks: result.checks
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Session validation error:', error);
    
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Session validation failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
