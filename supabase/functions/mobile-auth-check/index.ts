
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory cache for frequent lookups (expires after 5 minutes)
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== MOBILE AUTH CHECK FUNCTION START ===')
    
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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { phone, checkOnly } = requestBody;
    console.log('Received request:', { phone: phone?.replace(/\d/g, '*'), checkOnly })

    if (!phone || typeof phone !== 'string' || phone.length !== 10) {
      console.log('Invalid phone number provided:', phone?.length, 'digits')
      return new Response(
        JSON.stringify({ error: 'Valid 10-digit phone number required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean and validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      console.log('Invalid Indian mobile number format:', cleanPhone)
      return new Response(
        JSON.stringify({ error: 'Valid Indian mobile number required (6-9 followed by 9 digits)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check cache first
    const cacheKey = `mobile_check_${cleanPhone}`
    const cachedResult = cache.get(cacheKey)
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      console.log('Cache hit for phone:', cleanPhone.replace(/\d/g, '*'))
      return new Response(
        JSON.stringify(cachedResult.data),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== USER EXISTENCE CHECK ===')
    console.log('Phone number to search:', cleanPhone.replace(/\d/g, '*'))

    const startTime = Date.now()
    
    // Try using the new database function first
    try {
      const { data: userResults, error: rpcError } = await supabaseAdmin
        .rpc('check_mobile_number_exists', { mobile_num: cleanPhone })
        .single()

      if (rpcError) {
        console.log('RPC function error, falling back to direct query:', rpcError.message)
        throw rpcError
      }

      const queryTime = Date.now() - startTime
      console.log(`RPC query executed in ${queryTime}ms`)

      const userExists = userResults?.exists || false
      const existingUser = userResults?.profile || null

      console.log('RPC query result:', {
        found: userExists,
        userId: existingUser?.id,
        source: existingUser?.source,
        queryTime: `${queryTime}ms`
      })

      const result = checkOnly 
        ? { userExists } 
        : { userExists, profile: existingUser }

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (rpcError) {
      console.log('RPC failed, using fallback query method')
      
      // Fallback to direct queries
      const { data: profileResults, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, mobile_number, full_name')
        .eq('mobile_number', cleanPhone)
        .limit(1)

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error in profile query:', profileError)
        return new Response(
          JSON.stringify({ 
            error: 'Database error while checking user existence',
            details: profileError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      let userExists = false
      let existingUser = null

      if (profileResults && profileResults.length > 0) {
        userExists = true
        existingUser = {
          id: profileResults[0].id,
          mobile_number: profileResults[0].mobile_number,
          full_name: profileResults[0].full_name,
          source: 'user_profile'
        }
      } else {
        // Check farmers table as fallback
        const { data: farmerResults, error: farmerError } = await supabaseAdmin
          .from('farmers')
          .select('id, mobile_number')
          .eq('mobile_number', cleanPhone)
          .limit(1)

        if (farmerError && farmerError.code !== 'PGRST116') {
          console.error('Error in farmer query:', farmerError)
        } else if (farmerResults && farmerResults.length > 0) {
          userExists = true
          existingUser = {
            id: farmerResults[0].id,
            mobile_number: farmerResults[0].mobile_number,
            full_name: null,
            source: 'farmer'
          }
        }
      }

      const queryTime = Date.now() - startTime
      console.log(`Fallback query executed in ${queryTime}ms`)

      console.log('Fallback query result:', {
        found: userExists,
        userId: existingUser?.id,
        source: existingUser?.source,
        queryTime: `${queryTime}ms`
      })

      const result = checkOnly 
        ? { userExists } 
        : { userExists, profile: existingUser }

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      // Clean up old cache entries periodically
      if (cache.size > 1000) {
        const now = Date.now()
        for (const [key, value] of cache.entries()) {
          if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key)
          }
        }
      }

      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('=== MOBILE AUTH CHECK ERROR ===')
    console.error('Error details:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Check failed',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
