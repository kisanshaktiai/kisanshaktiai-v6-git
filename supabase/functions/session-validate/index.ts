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
    console.log('=== SESSION VALIDATION EDGE FUNCTION ===');
    
    const { access_token, refresh_token, user_id } = await req.json();

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

    // Validate JWT token structure
    const isValidJWT = (token: string): boolean => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const now = Math.floor(Date.now() / 1000);
        
        return payload.exp > now && payload.sub;
      } catch {
        return false;
      }
    };

    const accessTokenValid = isValidJWT(access_token);
    const refreshTokenValid = isValidJWT(refresh_token);

    console.log('Token validation:', {
      accessTokenValid,
      refreshTokenValid
    });

    // Try to use the session
    let sessionValid = false;
    let userValid = false;
    
    if (accessTokenValid && refreshTokenValid) {
      try {
        // Create a temporary client with the provided session
        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
        
        const { data, error } = await userClient.auth.setSession({
          access_token,
          refresh_token
        });

        if (!error && data.session && data.user) {
          sessionValid = true;
          
          // Verify user exists in our system
          if (user_id) {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', user_id)
              .maybeSingle();
            
            userValid = !!profile && !profileError;
          } else {
            userValid = true; // If no user_id provided, assume valid if session is valid
          }
        }
      } catch (error) {
        console.error('Session verification error:', error);
      }
    }

    const result = {
      valid: accessTokenValid && refreshTokenValid && sessionValid && userValid,
      checks: {
        access_token_valid: accessTokenValid,
        refresh_token_valid: refreshTokenValid,
        session_valid: sessionValid,
        user_valid: userValid
      },
      timestamp: new Date().toISOString()
    };

    console.log('Session validation result:', result);

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