import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActivationCodeRequest {
  activation_code: string;
}

interface ActivationCodeResponse {
  success: boolean;
  tenant?: any;
  branding?: any;
  features?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { activation_code }: ActivationCodeRequest = await req.json();

    if (!activation_code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Activation code is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔑 Validating activation code:', activation_code);

    // First, check if the activation code exists and is valid
    const { data: activation, error: activationError } = await supabase
      .from('activation_codes')
      .select(`
        *,
        tenant:tenants(
          id,
          name,
          slug,
          type,
          status,
          subscription_plan,
          metadata
        )
      `)
      .eq('code', activation_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (activationError || !activation) {
      console.log('❌ Invalid activation code:', activation_code);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired activation code' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if activation code is still valid (not expired)
    if (activation.expires_at && new Date(activation.expires_at) < new Date()) {
      console.log('⏰ Activation code expired:', activation_code);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Activation code has expired' 
        }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check usage limits
    if (activation.max_uses && activation.used_count >= activation.max_uses) {
      console.log('🚫 Activation code usage limit exceeded:', activation_code);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Activation code usage limit exceeded' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tenant = activation.tenant;
    if (!tenant) {
      console.log('❌ No tenant associated with activation code:', activation_code);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No organization associated with this activation code' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get tenant branding
    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single();

    // Get tenant features
    const { data: features } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single();

    // Update activation code usage
    const { error: updateError } = await supabase
      .from('activation_codes')
      .update({ 
        used_count: activation.used_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', activation.id);

    if (updateError) {
      console.warn('⚠️ Failed to update activation code usage:', updateError);
    }

    // Log successful activation
    await supabase
      .from('activation_logs')
      .insert({
        activation_code_id: activation.id,
        tenant_id: tenant.id,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          code: activation_code.toUpperCase()
        }
      });

    console.log('✅ Activation successful for tenant:', tenant.id);

    const response: ActivationCodeResponse = {
      success: true,
      tenant,
      branding: branding || null,
      features: features || null,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Activation validation error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during activation validation' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});