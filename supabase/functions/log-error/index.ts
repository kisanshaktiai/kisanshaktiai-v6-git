
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorLogRequest {
  id: string;
  message: string;
  stack?: string;
  component_stack?: string;
  error_boundary_level: string;
  user_agent: string;
  url: string;
  timestamp: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const errorData: ErrorLogRequest = await req.json();

    // Insert error log into database
    const { data, error } = await supabase
      .from('error_logs')
      .insert([{
        id: errorData.id,
        message: errorData.message,
        stack: errorData.stack,
        component_stack: errorData.component_stack,
        error_boundary_level: errorData.error_boundary_level,
        user_agent: errorData.user_agent,
        url: errorData.url,
        user_id: errorData.user_id,
        created_at: errorData.timestamp,
      }]);

    if (error) {
      console.error('Error inserting error log:', error);
      throw error;
    }

    console.log('Error logged successfully:', errorData.id);

    return new Response(
      JSON.stringify({ success: true, errorId: errorData.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error in log-error function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to log error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
