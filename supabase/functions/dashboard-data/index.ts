
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

    // Get farmer profile
    const { data: farmerProfile } = await supabaseClient
      .from('farmers')
      .select('id, total_land_acres, primary_crops, annual_income_range')
      .eq('id', user.id)
      .single()

    // Get lands summary
    const { data: lands } = await supabaseClient
      .from('lands')
      .select(`
        id, 
        name, 
        area_acres, 
        crop_history!crop_history_land_id_fkey(
          crop_name, 
          status, 
          growth_stage
        )
      `)
      .eq('farmer_id', user.id)
      .eq('is_active', true)

    // Get recent activities count
    const { count: activitiesCount } = await supabaseClient
      .from('land_activities')
      .select('*', { count: 'exact', head: true })
      .in('land_id', lands?.map(l => l.id) || [])
      .gte('activity_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get financial summary
    const { data: financialData } = await supabaseClient
      .from('financial_transactions')
      .select('transaction_type, amount')
      .eq('farmer_id', user.id)
      .gte('transaction_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    const totalIncome = financialData?.filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalExpense = financialData?.filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // Get weather alerts count
    const { count: alertsCount } = await supabaseClient
      .from('weather_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const dashboardData = {
      farmer: farmerProfile,
      summary: {
        totalLands: lands?.length || 0,
        totalArea: lands?.reduce((sum, land) => sum + (land.area_acres || 0), 0) || 0,
        activeCrops: lands?.filter(land => 
          land.crop_history?.some((crop: any) => crop.status === 'active')
        ).length || 0,
        recentActivities: activitiesCount || 0,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        weatherAlerts: alertsCount || 0
      },
      lands: lands || [],
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(dashboardData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Dashboard data error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
