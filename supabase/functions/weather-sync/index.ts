import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEATHER_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const weatherCache = new Map();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, use_tomorrow_io = true, force_refresh = false } = await req.json()

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: 'Latitude and longitude are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cacheKey = `weather_${latitude}_${longitude}`
    const now = Date.now()

    // Check cache first (unless force refresh)
    if (!force_refresh && weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey)
      if (now - cached.timestamp < WEATHER_CACHE_DURATION) {
        console.log('Returning cached weather data')
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let weatherData = null
    let dataSource = 'database'

    // Check database first
    if (!force_refresh) {
      const { data: dbWeather } = await supabaseClient
        .from('weather_current')
        .select('*')
        .eq('latitude', latitude)
        .eq('longitude', longitude)
        .gte('observation_time', new Date(now - WEATHER_CACHE_DURATION).toISOString())
        .order('observation_time', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (dbWeather) {
        weatherData = dbWeather
        dataSource = 'database'
      }
    }

    // Fetch fresh data if needed
    if (!weatherData) {
      const tomorrowApiKey = Deno.env.get('TOMORROW_IO_API_KEY')
      const openWeatherKey = Deno.env.get('OPENWEATHER_API_KEY')

      if (use_tomorrow_io && tomorrowApiKey) {
        try {
          const tomorrowUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${tomorrowApiKey}`
          const tomorrowResponse = await fetch(tomorrowUrl)
          
          if (tomorrowResponse.ok) {
            const tomorrowData = await tomorrowResponse.json()
            const values = tomorrowData.data?.values

            if (values) {
              weatherData = {
                temperature: values.temperature,
                feelsLike: values.temperatureApparent,
                humidity: values.humidity,
                windSpeed: values.windSpeed * 3.6, // Convert m/s to km/h
                weatherMain: getWeatherMain(values.weatherCode),
                weatherDescription: getWeatherDescription(values.weatherCode),
                weatherIcon: getWeatherIcon(values.weatherCode),
                timestamp: new Date().toISOString()
              }
              dataSource = 'tomorrow_io'
              console.log('Fetched weather from Tomorrow.io')
            }
          }
        } catch (error) {
          console.error('Tomorrow.io API error:', error)
        }
      }

      // Fallback to OpenWeather
      if (!weatherData && openWeatherKey) {
        try {
          const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=metric`
          const openWeatherResponse = await fetch(openWeatherUrl)
          
          if (openWeatherResponse.ok) {
            const openWeatherData = await openWeatherResponse.json()
            
            weatherData = {
              temperature: openWeatherData.main.temp,
              feelsLike: openWeatherData.main.feels_like,
              humidity: openWeatherData.main.humidity,
              windSpeed: openWeatherData.wind.speed * 3.6,
              weatherMain: openWeatherData.weather[0].main,
              weatherDescription: openWeatherData.weather[0].description,
              weatherIcon: openWeatherData.weather[0].icon,
              timestamp: new Date().toISOString()
            }
            dataSource = 'openweather'
            console.log('Fetched weather from OpenWeather')
          }
        } catch (error) {
          console.error('OpenWeather API error:', error)
        }
      }

      // Store in database if fresh data
      if (weatherData && dataSource !== 'database') {
        try {
          await supabaseClient.from('weather_current').upsert({
            latitude,
            longitude,
            temperature_celsius: weatherData.temperature,
            feels_like_celsius: weatherData.feelsLike,
            humidity_percent: weatherData.humidity,
            wind_speed_kmh: weatherData.windSpeed,
            weather_main: weatherData.weatherMain,
            weather_description: weatherData.weatherDescription,
            weather_icon: weatherData.weatherIcon,
            observation_time: weatherData.timestamp,
            data_source: dataSource
          })
        } catch (error) {
          console.error('Database storage error:', error)
        }
      }
    }

    if (!weatherData) {
      return new Response(JSON.stringify({ error: 'Unable to fetch weather data' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const response = {
      weather_data: weatherData,
      data_source: dataSource,
      timestamp: new Date().toISOString()
    }

    // Cache the response
    weatherCache.set(cacheKey, {
      data: response,
      timestamp: now
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Weather sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function getWeatherMain(code: number): string {
  if (code >= 1000 && code < 2000) return 'Clear'
  if (code >= 2000 && code < 3000) return 'Clouds'
  if (code >= 4000 && code < 5000) return 'Rain'
  return 'Clear'
}

function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    1000: 'Clear sky',
    1001: 'Cloudy',
    2000: 'Partly cloudy',
    4000: 'Light rain',
    4001: 'Rain'
  }
  return descriptions[code] || 'Clear'
}

function getWeatherIcon(code: number): string {
  if (code === 1000) return '01d'
  if (code >= 2000 && code < 3000) return '03d'
  if (code >= 4000 && code < 5000) return '09d'
  return '01d'
}
