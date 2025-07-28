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

    const { action, ...payload } = await req.json()

    let result
    switch (action) {
      case 'CREATE':
        result = await createLand(supabaseClient, user.id, payload)
        break
      case 'UPDATE':
        result = await updateLand(supabaseClient, user.id, payload)
        break
      case 'DELETE':
        result = await deleteLand(supabaseClient, user.id, payload.landId)
        break
      case 'GET_ALL':
        result = await getAllLands(supabaseClient, user.id, payload.tenantId)
        break
      case 'GET_ONE':
        result = await getLandById(supabaseClient, user.id, payload.landId)
        break
      case 'UPLOAD_PHOTO':
        result = await uploadLandPhoto(supabaseClient, user.id, payload)
        break
      case 'GENERATE_NAME':
        result = await generateUniqueLandName(supabaseClient, user.id, payload)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Land operations error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createLand(supabase: any, userId: string, landData: any) {
  console.log('Creating land for user:', userId, 'with data:', landData)
  
  // Validate required fields
  if (!landData.name || !landData.tenant_id || !landData.area_acres) {
    throw new Error('Missing required fields: name, tenant_id, area_acres')
  }

  // Ensure unique name
  const { data: existingLands } = await supabase
    .from('lands')
    .select('name')
    .eq('farmer_id', userId)
    .eq('tenant_id', landData.tenant_id)
    .ilike('name', `${landData.name}%`)

  let finalName = landData.name
  if (existingLands && existingLands.length > 0) {
    const baseName = landData.name
    let counter = 1
    while (existingLands.some((land: any) => land.name === finalName)) {
      finalName = `${baseName} ${counter}`
      counter++
    }
  }

  // Convert boundary_polygon to PostGIS geometry if provided
  let boundaryGeometry = null
  if (landData.boundary_polygon) {
    try {
      // Convert GeoJSON to WKT format for PostGIS
      const coords = landData.boundary_polygon.coordinates[0]
      const wktCoords = coords.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
      const wkt = `POLYGON((${wktCoords}))`
      
      // Use ST_GeomFromText to create PostGIS geometry
      const { data: geomResult } = await supabase
        .rpc('ST_GeomFromText', { wkt_text: wkt, srid: 4326 })
      
      boundaryGeometry = geomResult
    } catch (error) {
      console.warn('Failed to convert boundary to PostGIS geometry:', error)
      // Store as JSONB fallback in boundary_polygon_old
    }
  }

  // Map form fields to database columns correctly
  const finalLandData = {
    farmer_id: userId,
    tenant_id: landData.tenant_id,
    name: finalName,
    survey_number: landData.survey_number || null,
    area_acres: Number(landData.area_acres),
    ownership_type: landData.ownership_type || 'owned',
    irrigation_source: landData.irrigation_source || null,
    
    // Enhanced GPS tracking fields
    village: landData.village || null,
    taluka: landData.taluka || null,
    district: landData.district || null,
    state: landData.state || null,
    gps_accuracy_meters: landData.gps_accuracy_meters ? Number(landData.gps_accuracy_meters) : null,
    gps_recorded_at: landData.gps_recorded_at || new Date().toISOString(),
    boundary_method: landData.boundary_method || 'manual',
    location_context: landData.location_context || {},
    
    // Soil and farming data from form
    soil_type: landData.soil_type || null,
    water_source: landData.irrigation_source || null,
    
    // Store boundary as both PostGIS and JSONB
    boundary: boundaryGeometry,
    boundary_polygon_old: landData.boundary_polygon || null,
    center_point_old: landData.center_point || null,
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  }

  const { data, error } = await supabase
    .from('lands')
    .insert([finalLandData])
    .select(`
      *,
      soil_health:soil_health!soil_health_land_id_fkey(*),
      crop_history:crop_history!crop_history_land_id_fkey(*),
      ndvi_data:ndvi_data!ndvi_data_land_id_fkey(*),
      land_activities:land_activities!land_activities_land_id_fkey(*)
    `)
    .single()

  if (error) {
    console.error('Database error:', error)
    throw new Error(`Failed to create land: ${error.message}`)
  }

  console.log('Land created successfully:', data.id)
  return { success: true, data, message: 'Land created successfully' }
}

async function updateLand(supabase: any, userId: string, { landId, updates }: any) {
  const { data, error } = await supabase
    .from('lands')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', landId)
    .eq('farmer_id', userId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update land: ${error.message}`)
  return { success: true, data, message: 'Land updated successfully' }
}

async function deleteLand(supabase: any, userId: string, landId: string) {
  const { error } = await supabase
    .from('lands')
    .delete()
    .eq('id', landId)
    .eq('farmer_id', userId)

  if (error) throw new Error(`Failed to delete land: ${error.message}`)
  return { success: true, message: 'Land deleted successfully' }
}

async function getAllLands(supabase: any, userId: string, tenantId?: string) {
  let query = supabase
    .from('lands')
    .select(`
      *,
      soil_health:soil_health!soil_health_land_id_fkey(
        id, ph_level, organic_carbon, nitrogen_level, 
        phosphorus_level, potassium_level, soil_type, test_date, source
      ),
      crop_history:crop_history!crop_history_land_id_fkey(
        id, crop_name, variety, season, planting_date, 
        harvest_date, yield_kg_per_acre, growth_stage, status, notes
      ),
      ndvi_data:ndvi_data!ndvi_data_land_id_fkey(
        id, date, ndvi_value, satellite_source, image_url, cloud_cover
      ),
      land_activities:land_activities!land_activities_land_id_fkey(
        id, activity_type, description, quantity, unit, cost, activity_date, notes
      )
    `)
    .eq('farmer_id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: lands, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch lands: ${error.message}`)

  // Process and enhance the data
  const enhancedLands = lands?.map(land => {
    const soilHealth = land.soil_health?.[0]
    const currentCrop = land.crop_history?.find((crop: any) => crop.status === 'active')
    const recentNdvi = land.ndvi_data?.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )?.[0]
    const recentActivities = land.land_activities?.slice(0, 5) || []

    // Enhanced health score calculation
    const healthScore = calculateHealthScore(soilHealth, recentNdvi, currentCrop)

    return {
      ...land,
      soil_health: soilHealth,
      current_crop: currentCrop,
      recent_ndvi: recentNdvi,
      recent_activities: recentActivities,
      health_score: healthScore,
    }
  }) || []

  return { 
    success: true, 
    data: enhancedLands,
    total: enhancedLands.length,
    timestamp: new Date().toISOString()
  }
}

async function getLandById(supabase: any, userId: string, landId: string) {
  const { data, error } = await supabase
    .from('lands')
    .select(`
      *,
      soil_health:soil_health!soil_health_land_id_fkey(*),
      crop_history:crop_history!crop_history_land_id_fkey(*),
      ndvi_data:ndvi_data!ndvi_data_land_id_fkey(*),
      land_activities:land_activities!land_activities_land_id_fkey(*)
    `)
    .eq('id', landId)
    .eq('farmer_id', userId)
    .single()

  if (error) throw new Error(`Failed to fetch land: ${error.message}`)
  return { success: true, data }
}

async function uploadLandPhoto(supabase: any, userId: string, { landId, photoData, fileName }: any) {
  // Create proper file path with user folder structure
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = `${userId}/${landId || 'temp'}/${timestamp}_${fileName}`
  
  // Convert base64 to Uint8Array
  const binaryString = atob(photoData)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  const { data, error } = await supabase.storage
    .from('land-photos')
    .upload(filePath, bytes, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  const { data: publicUrl } = supabase.storage
    .from('land-photos')
    .getPublicUrl(filePath)

  return { 
    success: true, 
    data: { 
      url: publicUrl.publicUrl,
      path: filePath,
      fileName: fileName
    },
    message: 'Photo uploaded successfully'
  }
}

async function generateUniqueLandName(supabase: any, userId: string, { latitude, longitude, tenantId }: any) {
  // Generate location-based name
  const locationNames = [
    'North Field', 'South Field', 'East Field', 'West Field',
    'Upper Farm', 'Lower Farm', 'Main Field', 'Back Field',
    'River Side', 'Hill Top', 'Valley Field', 'Corner Plot'
  ]
  
  const currentDate = new Date()
  const dateStr = currentDate.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short' 
  })
  
  const timeStr = currentDate.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  })

  // Get existing land names to avoid duplicates
  const { data: existingLands } = await supabase
    .from('lands')
    .select('name')
    .eq('farmer_id', userId)
    .eq('tenant_id', tenantId)

  const existingNames = existingLands?.map((land: any) => land.name) || []
  
  // Try location-based names first
  for (const baseName of locationNames) {
    if (!existingNames.includes(baseName)) {
      return { success: true, name: baseName }
    }
  }
  
  // Fall back to date/time based names
  let baseName = `Field ${dateStr}`
  let counter = 1
  let finalName = baseName
  
  while (existingNames.includes(finalName)) {
    finalName = `${baseName} ${counter}`
    counter++
  }
  
  return { success: true, name: finalName }
}

function calculateHealthScore(soilHealth: any, ndviData: any, currentCrop: any): number {
  let score = 0
  let factors = 0

  // Soil health factors (60% weight)
  if (soilHealth) {
    let soilScore = 0
    let soilFactors = 0

    // pH level (optimal 6.0-7.5)
    if (soilHealth.ph_level) {
      const ph = soilHealth.ph_level
      if (ph >= 6.0 && ph <= 7.5) {
        soilScore += 5
      } else if (ph >= 5.5 && ph <= 8.0) {
        soilScore += 3
      } else {
        soilScore += 1
      }
      soilFactors++
    }

    // Organic carbon (higher is better, >0.75% is good)
    if (soilHealth.organic_carbon) {
      const oc = soilHealth.organic_carbon
      if (oc >= 0.75) {
        soilScore += 5
      } else if (oc >= 0.5) {
        soilScore += 3
      } else {
        soilScore += 1
      }
      soilFactors++
    }

    // NPK levels
    const nutrientLevels = [
      soilHealth.nitrogen_level,
      soilHealth.phosphorus_level,
      soilHealth.potassium_level
    ]

    nutrientLevels.forEach(level => {
      if (level) {
        switch (level) {
          case 'high':
            soilScore += 5
            break
          case 'medium':
            soilScore += 3
            break
          case 'low':
            soilScore += 1
            break
        }
        soilFactors++
      }
    })

    if (soilFactors > 0) {
      score += (soilScore / soilFactors) * 0.6
      factors += 0.6
    }
  }

  // NDVI health factors (25% weight)
  if (ndviData?.ndvi_value) {
    const ndvi = ndviData.ndvi_value
    let ndviScore = 0
    
    if (ndvi >= 0.7) {
      ndviScore = 5 // Excellent vegetation health
    } else if (ndvi >= 0.5) {
      ndviScore = 4 // Good vegetation health
    } else if (ndvi >= 0.3) {
      ndviScore = 3 // Fair vegetation health
    } else if (ndvi >= 0.1) {
      ndviScore = 2 // Poor vegetation health
    } else {
      ndviScore = 1 // Very poor vegetation health
    }
    
    score += ndviScore * 0.25
    factors += 0.25
  }

  // Crop status factors (15% weight)
  if (currentCrop) {
    let cropScore = 3 // Base score for having active crop
    
    if (currentCrop.status === 'active') {
      cropScore = 4
    } else if (currentCrop.status === 'harvested') {
      cropScore = 3
    } else if (currentCrop.status === 'failed') {
      cropScore = 1
    }
    
    score += cropScore * 0.15
    factors += 0.15
  }

  // Return calculated score or default
  return factors > 0 ? Math.min(5, score / factors) : 2.5
}