import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const microsoftPlanetaryKey = Deno.env.get('MICROSOFT_PLANETARY_COMPUTER_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { landId } = await req.json()

    console.log(`Processing satellite data for land: ${landId}`)

    // Get land details
    const { data: land, error: landError } = await supabase
      .from('lands')
      .select('*')
      .eq('id', landId)
      .single()

    if (landError || !land) {
      throw new Error(`Land not found: ${landError?.message}`)
    }

    // Calculate bounds from land area (simplified - assumes center point and area)
    const bounds = calculateBounds(land)
    
    // Search for Sentinel-2 imagery
    const imagery = await searchSentinel2Imagery(bounds, new Date())
    
    if (imagery.length === 0) {
      console.log('No suitable imagery found for the specified area and date')
      return new Response(
        JSON.stringify({ message: 'No imagery available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the best available image
    const bestImage = imagery[0]
    const processedData = await processImagery(bestImage, bounds)

    // Store satellite imagery record
    const { data: satImagery, error: satError } = await supabase
      .from('satellite_imagery')
      .insert({
        land_id: landId,
        acquisition_date: bestImage.acquisition_date,
        scene_id: bestImage.scene_id,
        tile_id: bestImage.tile_id,
        cloud_coverage: bestImage.cloud_coverage,
        bounds: bounds,
        image_urls: bestImage.image_urls,
        processed_indices: processedData.indices,
        download_status: 'completed',
        file_size_mb: bestImage.file_size_mb
      })
      .select()
      .single()

    if (satError) {
      console.error('Error storing satellite imagery:', satError)
    }

    // Store NDVI data
    const { error: ndviError } = await supabase
      .from('ndvi_data')
      .insert({
        land_id: landId,
        date: bestImage.acquisition_date,
        ndvi_value: processedData.indices.ndvi_avg,
        evi_value: processedData.indices.evi_avg,
        ndwi_value: processedData.indices.ndwi_avg,
        savi_value: processedData.indices.savi_avg,
        scene_id: bestImage.scene_id,
        tile_id: bestImage.tile_id,
        cloud_coverage: bestImage.cloud_coverage,
        satellite_source: 'sentinel-2',
        metadata: processedData.metadata
      })

    if (ndviError) {
      console.error('Error storing NDVI data:', ndviError)
    }

    // Perform health assessment
    const healthAssessment = await performHealthAssessment(landId, processedData)

    // Store health assessment
    const { error: healthError } = await supabase
      .from('crop_health_assessments')
      .insert(healthAssessment)

    if (healthError) {
      console.error('Error storing health assessment:', healthError)
    }

    // Check for alerts
    await checkForAlerts(landId, land.farmer_id, processedData, healthAssessment)

    return new Response(
      JSON.stringify({
        success: true,
        imagery: satImagery,
        health_score: healthAssessment.overall_health_score,
        ndvi_avg: processedData.indices.ndvi_avg
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Satellite processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function calculateBounds(land: any): Bounds {
  // Simplified bounds calculation - in production, use actual geometry
  const centerLat = 20.5937 // Default to India center
  const centerLon = 78.9629
  const areaKm = land.area_acres * 0.00404686 // Convert acres to km²
  const sideKm = Math.sqrt(areaKm)
  const latDelta = sideKm / 111.32 // Rough conversion
  const lonDelta = sideKm / (111.32 * Math.cos(centerLat * Math.PI / 180))

  return {
    minX: centerLon - lonDelta / 2,
    minY: centerLat - latDelta / 2,
    maxX: centerLon + lonDelta / 2,
    maxY: centerLat + latDelta / 2
  }
}

async function searchSentinel2Imagery(bounds: Bounds, date: Date) {
  // Mock Sentinel-2 search - replace with actual Microsoft Planetary Computer API
  const mockImagery = [{
    scene_id: `S2_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}`,
    tile_id: '43PGM',
    acquisition_date: date.toISOString().split('T')[0],
    cloud_coverage: Math.random() * 20, // 0-20% cloud cover
    image_urls: {
      red: 'https://example.com/red.tif',
      nir: 'https://example.com/nir.tif',
      blue: 'https://example.com/blue.tif',
      green: 'https://example.com/green.tif'
    },
    file_size_mb: 150 + Math.random() * 100
  }]

  return mockImagery
}

async function processImagery(imagery: any, bounds: Bounds) {
  // Mock processing - replace with actual image processing
  const ndvi_avg = 0.3 + Math.random() * 0.5 // NDVI between 0.3-0.8
  const evi_avg = ndvi_avg * 0.8 + Math.random() * 0.1
  const ndwi_avg = Math.random() * 0.4 - 0.2 // NDWI between -0.2 to 0.2
  const savi_avg = ndvi_avg * 0.9 + Math.random() * 0.05

  return {
    indices: {
      ndvi_avg,
      ndvi_min: Math.max(0, ndvi_avg - 0.2),
      ndvi_max: Math.min(1, ndvi_avg + 0.2),
      ndvi_std: 0.05 + Math.random() * 0.1,
      evi_avg,
      ndwi_avg,
      savi_avg
    },
    metadata: {
      processing_date: new Date().toISOString(),
      algorithm_version: '1.0',
      quality_flags: ['clear', 'usable']
    }
  }
}

async function performHealthAssessment(landId: string, processedData: any) {
  const { data: landInfo } = await supabase
    .from('lands')
    .select('current_crop, crop_stage')
    .eq('id', landId)
    .single()

  const growthStage = landInfo?.crop_stage || 'vegetative'
  const ndviAvg = processedData.indices.ndvi_avg

  // Calculate health score using database function
  const { data: healthScore } = await supabase
    .rpc('calculate_crop_health_score', {
      p_ndvi_avg: ndviAvg,
      p_growth_stage: growthStage
    })

  // Detect stress indicators
  const { data: stressIndicators } = await supabase
    .rpc('detect_stress_indicators', {
      p_ndvi_current: ndviAvg,
      p_ndvi_previous: null, // Would get from previous assessment
      p_growth_stage: growthStage
    })

  // Detect problem areas (simplified)
  const problemAreas = []
  if (ndviAvg < 0.3) {
    problemAreas.push({
      type: 'low_vigor',
      severity: 'high',
      area_percentage: 25 + Math.random() * 30,
      location: 'center-west'
    })
  }

  const recommendations = []
  if (ndviAvg < 0.4) {
    recommendations.push({
      type: 'irrigation',
      priority: 'high',
      description: 'Increase irrigation frequency'
    })
    recommendations.push({
      type: 'fertilizer',
      priority: 'medium',
      description: 'Apply nitrogen-rich fertilizer'
    })
  }

  const alertLevel = healthScore < 30 ? 'critical' : 
                   healthScore < 50 ? 'high' :
                   healthScore < 70 ? 'medium' : 'normal'

  return {
    land_id: landId,
    assessment_date: new Date().toISOString().split('T')[0],
    overall_health_score: healthScore || 50,
    ndvi_avg: processedData.indices.ndvi_avg,
    ndvi_min: processedData.indices.ndvi_min,
    ndvi_max: processedData.indices.ndvi_max,
    ndvi_std: processedData.indices.ndvi_std,
    problem_areas: problemAreas,
    stress_indicators: stressIndicators || {},
    growth_stage: growthStage,
    predicted_yield: null,
    comparison_data: {},
    recommendations,
    alert_level: alertLevel
  }
}

async function checkForAlerts(landId: string, farmerId: string, processedData: any, healthAssessment: any) {
  const alerts = []

  // NDVI drop alert
  const { data: previousNdvi } = await supabase
    .from('ndvi_data')
    .select('ndvi_value')
    .eq('land_id', landId)
    .order('date', { ascending: false })
    .limit(2)

  if (previousNdvi && previousNdvi.length > 1) {
    const current = processedData.indices.ndvi_avg
    const previous = previousNdvi[1].ndvi_value
    const change = current - previous

    if (change < -0.1) {
      alerts.push({
        land_id: landId,
        farmer_id: farmerId,
        alert_type: 'ndvi_drop',
        severity: change < -0.2 ? 'critical' : 'high',
        title: 'Significant NDVI Drop Detected',
        description: `NDVI decreased by ${Math.abs(change).toFixed(3)} since last measurement`,
        ndvi_change: change,
        trigger_values: { previous, current },
        recommendations: [
          'Inspect field for pest damage or disease',
          'Check irrigation system',
          'Consider soil testing'
        ]
      })
    }
  }

  // Low health score alert
  if (healthAssessment.overall_health_score < 50) {
    alerts.push({
      land_id: landId,
      farmer_id: farmerId,
      alert_type: 'health_decline',
      severity: healthAssessment.overall_health_score < 30 ? 'critical' : 'high',
      title: 'Crop Health Below Normal',
      description: `Health score is ${healthAssessment.overall_health_score}/100`,
      trigger_values: { health_score: healthAssessment.overall_health_score },
      recommendations: healthAssessment.recommendations.map((r: any) => r.description)
    })
  }

  // Store alerts
  for (const alert of alerts) {
    await supabase.from('satellite_alerts').insert(alert)
  }
}