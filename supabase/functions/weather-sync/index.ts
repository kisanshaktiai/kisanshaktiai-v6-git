import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
  rain1h: number;
  rain24h: number;
  cloudCover: number;
  weatherMain: string;
  weatherDescription: string;
  weatherIcon: string;
  sunrise: number;
  sunset: number;
}

// API keys from Supabase secrets
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')
const TOMORROW_IO_API_KEY = Deno.env.get('TOMORROW_IO_API_KEY')

async function fetchTomorrowIoData(lat: number, lon: number): Promise<WeatherData | null> {
  if (!TOMORROW_IO_API_KEY) {
    console.log('Tomorrow.io API key not configured, falling back to OpenWeather')
    return null
  }

  try {
    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${TOMORROW_IO_API_KEY}`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('Tomorrow.io API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const values = data.data.values
    
    // Map Tomorrow.io weather codes to OpenWeather-like descriptions
    const getWeatherDescription = (weatherCode: number) => {
      const weatherCodes: Record<number, { main: string; description: string; icon: string }> = {
        1000: { main: 'Clear', description: 'clear sky', icon: '01d' },
        1100: { main: 'Clear', description: 'mostly clear', icon: '01d' },
        1101: { main: 'Clouds', description: 'partly cloudy', icon: '02d' },
        1102: { main: 'Clouds', description: 'mostly cloudy', icon: '03d' },
        1001: { main: 'Clouds', description: 'cloudy', icon: '04d' },
        2000: { main: 'Clear', description: 'fog', icon: '50d' },
        4000: { main: 'Rain', description: 'drizzle', icon: '09d' },
        4001: { main: 'Rain', description: 'rain', icon: '10d' },
        4200: { main: 'Rain', description: 'light rain', icon: '10d' },
        4201: { main: 'Rain', description: 'heavy rain', icon: '10d' },
        5000: { main: 'Snow', description: 'snow', icon: '13d' },
        5001: { main: 'Snow', description: 'flurries', icon: '13d' },
        5100: { main: 'Snow', description: 'light snow', icon: '13d' },
        5101: { main: 'Snow', description: 'heavy snow', icon: '13d' },
        6000: { main: 'Snow', description: 'freezing drizzle', icon: '13d' },
        6001: { main: 'Snow', description: 'freezing rain', icon: '13d' },
        6200: { main: 'Snow', description: 'light freezing rain', icon: '13d' },
        6201: { main: 'Snow', description: 'heavy freezing rain', icon: '13d' },
        7000: { main: 'Snow', description: 'ice pellets', icon: '13d' },
        7101: { main: 'Snow', description: 'heavy ice pellets', icon: '13d' },
        7102: { main: 'Snow', description: 'light ice pellets', icon: '13d' },
        8000: { main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' }
      }
      
      return weatherCodes[weatherCode] || { main: 'Clear', description: 'clear sky', icon: '01d' }
    }

    const weatherInfo = getWeatherDescription(values.weatherCode || 1000)
    
    return {
      latitude: lat,
      longitude: lon,
      temperature: values.temperature,
      feelsLike: values.temperatureApparent,
      humidity: values.humidity,
      pressure: values.pressureSeaLevel || values.pressureSurfaceLevel || 1013,
      windSpeed: (values.windSpeed || 0) * 3.6, // Convert m/s to km/h
      windDirection: values.windDirection || 0,
      visibility: (values.visibility || 16000) / 1000, // Convert to km
      uvIndex: values.uvIndex || 0,
      rain1h: values.precipitationIntensity || 0,
      rain24h: values.precipitationIntensity || 0, // Approximation
      cloudCover: values.cloudCover || 0,
      weatherMain: weatherInfo.main,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
      sunrise: Date.now() / 1000 + 6 * 3600, // Approximate sunrise (6 AM)
      sunset: Date.now() / 1000 + 18 * 3600, // Approximate sunset (6 PM)
    }
  } catch (error) {
    console.error('Error fetching Tomorrow.io data:', error)
    return null
  }
}

async function fetchOpenWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  if (!OPENWEATHER_API_KEY) {
    console.error('OpenWeather API key not configured')
    return null
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('OpenWeather API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    return {
      latitude: lat,
      longitude: lon,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: (data.wind?.speed || 0) * 3.6, // Convert m/s to km/h
      windDirection: data.wind?.deg || 0,
      visibility: (data.visibility || 10000) / 1000, // Convert to km
      uvIndex: 0, // Requires separate API call
      rain1h: data.rain?.['1h'] || 0,
      rain24h: data.rain?.['1h'] || 0, // Approximate
      cloudCover: data.clouds.all,
      weatherMain: data.weather[0].main,
      weatherDescription: data.weather[0].description,
      weatherIcon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    }
  } catch (error) {
    console.error('Error fetching OpenWeather data:', error)
    return null
  }
}

async function fetchWeatherForecast(lat: number, lon: number): Promise<any[]> {
  if (!OPENWEATHER_API_KEY) {
    console.error('OpenWeather API key not configured')
    return []
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('OpenWeather forecast API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()
    
    return data.list.map((item: any) => ({
      forecast_time: new Date(item.dt * 1000).toISOString(),
      forecast_type: 'hourly',
      temperature_celsius: item.main.temp,
      temperature_min_celsius: item.main.temp_min,
      temperature_max_celsius: item.main.temp_max,
      feels_like_celsius: item.main.feels_like,
      humidity_percent: item.main.humidity,
      pressure_hpa: item.main.pressure,
      wind_speed_kmh: (item.wind?.speed || 0) * 3.6,
      wind_direction_degrees: item.wind?.deg || 0,
      rain_probability_percent: Math.round((item.pop || 0) * 100),
      rain_amount_mm: item.rain?.['3h'] || 0,
      cloud_cover_percent: item.clouds.all,
      weather_main: item.weather[0].main,
      weather_description: item.weather[0].description,
      weather_icon: item.weather[0].icon,
      latitude: lat,
      longitude: lon,
      data_source: 'openweather'
    }))
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    return []
  }
}

function calculateAgriculturalMetrics(weatherData: WeatherData) {
  // Calculate evapotranspiration (simplified)
  const et = (0.0023 * (weatherData.temperature + 17.8) * 
    Math.sqrt(Math.abs(weatherData.humidity - 50)) * 
    (15 / 2.45) * (1 + weatherData.windSpeed / 67))
  
  // Calculate growing degree days
  const gdd = Math.max(0, weatherData.temperature - 10) // Base temp 10°C
  
  return {
    evapotranspiration_mm: Math.round(et * 100) / 100,
    growing_degree_days: Math.round(gdd * 100) / 100,
    soil_temperature_celsius: weatherData.temperature - 2, // Approximate
    soil_moisture_percent: Math.max(20, Math.min(80, 100 - weatherData.humidity)) // Inverse relationship
  }
}

async function saveWeatherData(supabase: any, weatherData: WeatherData, station_id: string | null = null) {
  const agricultural = calculateAgriculturalMetrics(weatherData)
  
  const currentWeather = {
    station_id,
    latitude: weatherData.latitude,
    longitude: weatherData.longitude,
    temperature_celsius: weatherData.temperature,
    feels_like_celsius: weatherData.feelsLike,
    humidity_percent: weatherData.humidity,
    pressure_hpa: weatherData.pressure,
    wind_speed_kmh: weatherData.windSpeed,
    wind_direction_degrees: weatherData.windDirection,
    visibility_km: weatherData.visibility,
    uv_index: weatherData.uvIndex,
    rain_1h_mm: weatherData.rain1h,
    rain_24h_mm: weatherData.rain24h,
    cloud_cover_percent: weatherData.cloudCover,
    weather_main: weatherData.weatherMain,
    weather_description: weatherData.weatherDescription,
    weather_icon: weatherData.weatherIcon,
    sunrise: new Date(weatherData.sunrise * 1000).toISOString(),
    sunset: new Date(weatherData.sunset * 1000).toISOString(),
    moon_phase: 0.5, // Default - would need lunar API
    evapotranspiration_mm: agricultural.evapotranspiration_mm,
    soil_temperature_celsius: agricultural.soil_temperature_celsius,
    soil_moisture_percent: agricultural.soil_moisture_percent,
    growing_degree_days: agricultural.growing_degree_days,
    data_source: TOMORROW_IO_API_KEY ? 'tomorrow_io' : 'openweather',
    observation_time: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('weather_current')
    .insert(currentWeather)

  if (error) {
    console.error('Error saving weather data:', error)
    return false
  }

  console.log('Weather data saved successfully')
  return true
}

async function saveForecastData(supabase: any, forecasts: any[]) {
  if (forecasts.length === 0) return true

  const { error } = await supabase
    .from('weather_forecasts')
    .insert(forecasts)

  if (error) {
    console.error('Error saving forecast data:', error)
    return false
  }

  console.log(`${forecasts.length} forecast records saved`)
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

    const { latitude, longitude, station_id, use_tomorrow_io } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching weather data for ${latitude}, ${longitude}`)

    // Try Tomorrow.io first if requested and API key is available, then fallback to OpenWeather
    let weatherData = null
    
    if (use_tomorrow_io && TOMORROW_IO_API_KEY) {
      console.log('Fetching from Tomorrow.io API')
      weatherData = await fetchTomorrowIoData(latitude, longitude)
    }
    
    if (!weatherData && OPENWEATHER_API_KEY) {
      console.log('Fetching from OpenWeather API')
      weatherData = await fetchOpenWeatherData(latitude, longitude)
    }
    
    if (!weatherData) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data from all sources' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Save current weather
    const currentSaved = await saveWeatherData(supabase, weatherData, station_id)

    // Fetch and save forecast
    const forecasts = await fetchWeatherForecast(latitude, longitude)
    const forecastSaved = await saveForecastData(supabase, forecasts)

    return new Response(
      JSON.stringify({ 
        success: true, 
        current_weather_saved: currentSaved,
        forecast_saved: forecastSaved,
        forecast_count: forecasts.length,
        weather_data: weatherData,
        data_source: TOMORROW_IO_API_KEY && use_tomorrow_io ? 'tomorrow_io' : 'openweather'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Weather sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
