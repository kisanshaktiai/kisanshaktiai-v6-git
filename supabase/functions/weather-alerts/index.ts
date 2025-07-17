import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertThresholds {
  temperature_min_alert: number;
  temperature_max_alert: number;
  wind_speed_alert_kmh: number;
  rain_probability_alert_percent: number;
  humidity_high_alert_percent: number;
  humidity_low_alert_percent: number;
}

interface WeatherConditions {
  temperature_celsius: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  rain_probability_percent: number;
  weather_main: string;
}

function checkAlertConditions(weather: WeatherConditions, thresholds: AlertThresholds): any[] {
  const alerts = []

  // Frost warning
  if (weather.temperature_celsius <= thresholds.temperature_min_alert) {
    alerts.push({
      event_type: 'frost',
      severity: weather.temperature_celsius <= 0 ? 'severe' : 'moderate',
      urgency: 'immediate',
      certainty: 'observed',
      title: 'Frost Warning',
      description: `Temperature has dropped to ${weather.temperature_celsius}°C. Protect sensitive crops.`,
      crop_impact_level: 'high',
      affected_activities: ['spraying', 'watering', 'harvesting'],
      recommendations: [
        'Cover sensitive plants',
        'Use frost protection methods',
        'Avoid watering in evening'
      ]
    })
  }

  // Heat warning
  if (weather.temperature_celsius >= thresholds.temperature_max_alert) {
    alerts.push({
      event_type: 'heat',
      severity: weather.temperature_celsius >= 45 ? 'extreme' : 'severe',
      urgency: 'immediate',
      certainty: 'observed',
      title: 'Heat Warning',
      description: `High temperature of ${weather.temperature_celsius}°C detected. Take precautions.`,
      crop_impact_level: 'high',
      affected_activities: ['spraying', 'field_work', 'harvesting'],
      recommendations: [
        'Increase irrigation frequency',
        'Avoid midday field work',
        'Provide shade for workers',
        'Check soil moisture levels'
      ]
    })
  }

  // High wind warning
  if (weather.wind_speed_kmh >= thresholds.wind_speed_alert_kmh) {
    alerts.push({
      event_type: 'wind',
      severity: weather.wind_speed_kmh >= 40 ? 'severe' : 'moderate',
      urgency: 'immediate',
      certainty: 'observed',
      title: 'High Wind Warning',
      description: `Strong winds of ${weather.wind_speed_kmh} km/h detected. Avoid spraying operations.`,
      crop_impact_level: 'medium',
      affected_activities: ['spraying', 'drone_operations'],
      recommendations: [
        'Postpone spraying operations',
        'Secure loose farm equipment',
        'Check for crop damage after winds subside'
      ]
    })
  }

  // Rain alert
  if (weather.rain_probability_percent >= thresholds.rain_probability_alert_percent) {
    alerts.push({
      event_type: 'rain',
      severity: weather.rain_probability_percent >= 90 ? 'severe' : 'moderate',
      urgency: 'expected',
      certainty: 'likely',
      title: 'Heavy Rain Expected',
      description: `${weather.rain_probability_percent}% chance of rain. Plan activities accordingly.`,
      crop_impact_level: 'medium',
      affected_activities: ['spraying', 'harvesting', 'field_work'],
      recommendations: [
        'Complete spraying before rain',
        'Ensure proper drainage',
        'Postpone harvest if possible',
        'Cover stored produce'
      ]
    })
  }

  // Humidity alerts
  if (weather.humidity_percent >= thresholds.humidity_high_alert_percent) {
    alerts.push({
      event_type: 'humidity',
      severity: 'moderate',
      urgency: 'immediate',
      certainty: 'observed',
      title: 'High Humidity Alert',
      description: `High humidity of ${weather.humidity_percent}% increases disease risk.`,
      crop_impact_level: 'medium',
      affected_activities: ['disease_monitoring'],
      recommendations: [
        'Monitor crops for fungal diseases',
        'Improve air circulation',
        'Avoid overhead watering',
        'Apply preventive fungicides if needed'
      ]
    })
  }

  if (weather.humidity_percent <= thresholds.humidity_low_alert_percent) {
    alerts.push({
      event_type: 'humidity',
      severity: 'moderate',
      urgency: 'immediate',
      certainty: 'observed',
      title: 'Low Humidity Alert',
      description: `Low humidity of ${weather.humidity_percent}% may stress crops.`,
      crop_impact_level: 'medium',
      affected_activities: ['irrigation'],
      recommendations: [
        'Increase irrigation frequency',
        'Monitor soil moisture',
        'Provide mulching to retain moisture',
        'Consider misting systems'
      ]
    })
  }

  return alerts
}

function generateSprayRecommendations(weather: WeatherConditions, thresholds: any): any {
  const sprayScore = calculateSprayScore(weather)
  
  let recommendation = 'Not Suitable'
  let color = 'red'
  let reasons = []

  if (sprayScore >= 80) {
    recommendation = 'Excellent'
    color = 'green'
  } else if (sprayScore >= 60) {
    recommendation = 'Good'
    color = 'green'
  } else if (sprayScore >= 40) {
    recommendation = 'Fair'
    color = 'yellow'
    if (weather.wind_speed_kmh > thresholds.max_wind_speed_spray_kmh) {
      reasons.push('High wind speed')
    }
    if (weather.rain_probability_percent > thresholds.max_rain_probability_spray_percent) {
      reasons.push('Rain expected')
    }
  } else {
    recommendation = 'Poor'
    color = 'red'
    if (weather.temperature_celsius < thresholds.min_temperature_spray_celsius) {
      reasons.push('Temperature too low')
    }
    if (weather.temperature_celsius > thresholds.max_temperature_spray_celsius) {
      reasons.push('Temperature too high')
    }
    if (weather.wind_speed_kmh > thresholds.max_wind_speed_spray_kmh) {
      reasons.push('Wind speed too high')
    }
    if (weather.rain_probability_percent > thresholds.max_rain_probability_spray_percent) {
      reasons.push('High rain probability')
    }
  }

  return {
    score: sprayScore,
    recommendation,
    color,
    reasons,
    optimal_time: sprayScore >= 60 ? 'Now' : 'Wait for better conditions'
  }
}

function calculateSprayScore(weather: WeatherConditions): number {
  let score = 100

  // Temperature penalties
  if (weather.temperature_celsius < 10 || weather.temperature_celsius > 35) {
    score -= 30
  } else if (weather.temperature_celsius < 15 || weather.temperature_celsius > 30) {
    score -= 15
  }

  // Wind speed penalties
  if (weather.wind_speed_kmh > 15) {
    score -= 25
  } else if (weather.wind_speed_kmh > 10) {
    score -= 10
  }

  // Humidity penalties
  if (weather.humidity_percent > 85) {
    score -= 20
  } else if (weather.humidity_percent < 30) {
    score -= 15
  }

  // Rain probability penalties
  if (weather.rain_probability_percent > 20) {
    score -= (weather.rain_probability_percent - 20)
  }

  return Math.max(0, score)
}

async function saveWeatherAlert(supabase: any, alert: any, latitude: number, longitude: number) {
  const alertData = {
    alert_id: `${alert.event_type}_${Date.now()}`,
    area_name: 'Custom Location',
    latitude,
    longitude,
    event_type: alert.event_type,
    severity: alert.severity,
    urgency: alert.urgency,
    certainty: alert.certainty,
    title: alert.title,
    description: alert.description,
    instruction: alert.recommendations?.join('; ') || '',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    crop_impact_level: alert.crop_impact_level,
    affected_activities: alert.affected_activities,
    recommendations: alert.recommendations,
    data_source: 'weather-alerts-function',
    is_active: true
  }

  const { error } = await supabase
    .from('weather_alerts')
    .insert(alertData)

  if (error) {
    console.error('Error saving weather alert:', error)
    return false
  }

  return true
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { latitude, longitude, farmer_id } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get farmer's alert preferences
    let thresholds = {
      temperature_min_alert: 5,
      temperature_max_alert: 40,
      wind_speed_alert_kmh: 25,
      rain_probability_alert_percent: 80,
      humidity_high_alert_percent: 85,
      humidity_low_alert_percent: 30,
      max_wind_speed_spray_kmh: 15,
      min_temperature_spray_celsius: 10,
      max_temperature_spray_celsius: 35,
      max_rain_probability_spray_percent: 20
    }

    if (farmer_id) {
      const { data: preferences } = await supabase
        .from('weather_preferences')
        .select('*')
        .eq('farmer_id', farmer_id)
        .single()

      if (preferences) {
        thresholds = { ...thresholds, ...preferences }
      }
    }

    // Get current weather
    const { data: currentWeather } = await supabase
      .from('weather_current')
      .select('*')
      .eq('latitude', latitude)
      .eq('longitude', longitude)
      .order('observation_time', { ascending: false })
      .limit(1)
      .single()

    if (!currentWeather) {
      return new Response(
        JSON.stringify({ error: 'No current weather data found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for alert conditions
    const weather: WeatherConditions = {
      temperature_celsius: currentWeather.temperature_celsius,
      humidity_percent: currentWeather.humidity_percent,
      wind_speed_kmh: currentWeather.wind_speed_kmh,
      rain_probability_percent: 0, // From forecast
      weather_main: currentWeather.weather_main
    }

    // Get rain probability from nearest forecast
    const { data: forecast } = await supabase
      .from('weather_forecasts')
      .select('rain_probability_percent')
      .eq('latitude', latitude)
      .eq('longitude', longitude)
      .gte('forecast_time', new Date().toISOString())
      .order('forecast_time', { ascending: true })
      .limit(1)
      .single()

    if (forecast) {
      weather.rain_probability_percent = forecast.rain_probability_percent || 0
    }

    const alerts = checkAlertConditions(weather, thresholds)
    
    // Save alerts to database
    for (const alert of alerts) {
      await saveWeatherAlert(supabase, alert, latitude, longitude)
    }

    // Generate spray recommendations
    const sprayRecommendation = generateSprayRecommendations(weather, thresholds)

    return new Response(
      JSON.stringify({ 
        success: true,
        alerts_generated: alerts.length,
        alerts,
        spray_recommendation: sprayRecommendation,
        weather_conditions: weather
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Weather alerts error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})