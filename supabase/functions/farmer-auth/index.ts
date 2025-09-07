import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, mobile_number, pin, farmer_data } = await req.json();
    console.log(`[farmer-auth] Action: ${action}, Mobile: ${mobile_number}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'check_exists') {
      // Check if farmer exists
      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('id, mobile_number, tenant_id')
        .eq('mobile_number', mobile_number)
        .maybeSingle();

      if (error) {
        console.error('[farmer-auth] Error checking farmer:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ exists: !!farmer, farmer_id: farmer?.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Verify PIN and login
      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('mobile_number', mobile_number)
        .eq('pin', pin)
        .maybeSingle();

      if (error) {
        console.error('[farmer-auth] Login error:', error);
        throw error;
      }

      if (!farmer) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid mobile number or PIN' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user profile if exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', farmer.id)
        .maybeSingle();

      // Create a simple session token (in production, use proper JWT)
      const sessionToken = `farmer_${farmer.id}_${Date.now()}`;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          farmer,
          profile,
          session: {
            token: sessionToken,
            farmer_id: farmer.id,
            tenant_id: farmer.tenant_id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'register') {
      // Register new farmer
      const tenantId = farmer_data?.tenant_id || 'emergency-tenant';
      
      // Create farmer record
      const { data: newFarmer, error: farmerError } = await supabase
        .from('farmers')
        .insert({
          mobile_number,
          pin,
          tenant_id: tenantId,
          full_name: farmer_data?.full_name || '',
          state: farmer_data?.state || '',
          district: farmer_data?.district || '',
          village: farmer_data?.village || '',
          preferred_language: farmer_data?.preferred_language || 'hi',
          coordinates: farmer_data?.coordinates || null,
          is_active: true
        })
        .select()
        .single();

      if (farmerError) {
        console.error('[farmer-auth] Registration error:', farmerError);
        
        // Check if it's a duplicate entry
        if (farmerError.code === '23505') {
          return new Response(
            JSON.stringify({ success: false, error: 'Mobile number already registered' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw farmerError;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: newFarmer.id,
          mobile_number,
          full_name: farmer_data?.full_name || '',
          display_name: farmer_data?.full_name || '',
          state: farmer_data?.state || '',
          district: farmer_data?.district || '',
          village: farmer_data?.village || '',
          preferred_language: farmer_data?.preferred_language || 'hi',
          coordinates: farmer_data?.coordinates || null
        });

      if (profileError) {
        console.warn('[farmer-auth] Profile creation warning:', profileError);
        // Continue even if profile creation fails
      }

      // Create session token
      const sessionToken = `farmer_${newFarmer.id}_${Date.now()}`;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          farmer: newFarmer,
          session: {
            token: sessionToken,
            farmer_id: newFarmer.id,
            tenant_id: newFarmer.tenant_id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_pin') {
      // Update PIN
      const { old_pin, new_pin } = farmer_data || {};
      
      const { data: farmer, error: checkError } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', mobile_number)
        .eq('pin', old_pin)
        .maybeSingle();

      if (checkError || !farmer) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid old PIN' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('farmers')
        .update({ pin: new_pin, updated_at: new Date().toISOString() })
        .eq('id', farmer.id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'PIN updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Health check endpoint
    if (action === 'health') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'farmer-auth'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[farmer-auth] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});