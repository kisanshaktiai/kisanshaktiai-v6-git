
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { landId } = await req.json().catch(() => ({}))

    let query = supabaseClient
      .from('lands')
      .select(`
        id,
        name,
        area_acres,
        location,
        soil_type,
        created_at,
        crop_history!crop_history_land_id_fkey(
          id,
          crop_name,
          variety,
          status,
          growth_stage,
          planting_date,
          harvest_date,
          yield_kg_per_acre
        ),
        soil_health!soil_health_land_id_fkey(
          ph_level,
          organic_carbon,
          nitrogen_level,
          phosphorus_level,
          potassium_level,
          test_date
        ),
        ndvi_data!ndvi_data_land_id_fkey(
          date,
          ndvi_value,
          satellite_source
        ),
        land_activities!land_activities_land_id_fkey(
          activity_type,
          description,
          activity_date,
          cost
        )
      `)
      .eq('farmer_id', user.id)
      .eq('is_active', true)

    if (landId) {
      query = query.eq('id', landId)
    }

    const { data: lands, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Process and aggregate the data
    const processedLands = lands?.map(land => {
      const latestSoilHealth = land.soil_health?.[0]
      const currentCrop = land.crop_history?.find((crop: any) => crop.status === 'active')
      const recentNdvi = land.ndvi_data?.[0]
      const recentActivities = land.land_activities?.slice(0, 5) || []

      // Calculate health score
      let healthScore = 2.5
      if (latestSoilHealth) {
        const phScore = latestSoilHealth.ph_level >= 6.0 && latestSoilHealth.ph_level <= 7.5 ? 1 : 0
        const carbonScore = latestSoilHealth.organic_carbon >= 0.5 ? 1 : 0
        const npkScore = (latestSoilHealth.nitrogen_level >= 280 ? 1 : 0) +
                        (latestSoilHealth.phosphorus_level >= 11 ? 1 : 0) +
                        (latestSoilHealth.potassium_level >= 120 ? 1 : 0)
        healthScore = (phScore + carbonScore + npkScore / 3) * 2.5
      }

      return {
        ...land,
        soil_health: latestSoilHealth,
        current_crop: currentCrop,
        recent_ndvi: recentNdvi,
        recent_activities: recentActivities,
        health_score: Math.round(healthScore * 10) / 10
      }
    }) || []

    return new Response(JSON.stringify({
      lands: processedLands,
      total: processedLands.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Land summary error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
