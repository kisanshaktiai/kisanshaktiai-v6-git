export interface WeatherBackground {
  gradient: string;
  iconColor: string;
  textColor: string;
  animation?: string;
}

export const getWeatherBackground = (weatherMain: string, weatherDescription: string): WeatherBackground => {
  const weather = weatherMain?.toLowerCase() || '';
  const description = weatherDescription?.toLowerCase() || '';

  // Clear/Sunny conditions
  if (weather === 'clear' || description.includes('clear') || description.includes('sunny')) {
    return {
      gradient: 'bg-gradient-to-br from-yellow-400 via-orange-300 to-pink-300',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
      animation: 'animate-pulse'
    };
  }

  // Rain conditions
  if (weather === 'rain' || description.includes('rain') || description.includes('drizzle')) {
    if (description.includes('light')) {
      return {
        gradient: 'bg-gradient-to-br from-blue-300 via-blue-200 to-indigo-300',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-900'
      };
    }
    return {
      gradient: 'bg-gradient-to-br from-blue-500 via-blue-400 to-purple-400',
      iconColor: 'text-blue-200',
      textColor: 'text-blue-100',
      animation: 'animate-bounce'
    };
  }

  // Cloudy conditions
  if (weather === 'clouds' || description.includes('cloud')) {
    if (description.includes('partly') || description.includes('few')) {
      return {
        gradient: 'bg-gradient-to-br from-blue-200 via-white to-yellow-200',
        iconColor: 'text-blue-500',
        textColor: 'text-blue-800'
      };
    }
    return {
      gradient: 'bg-gradient-to-br from-gray-400 via-gray-300 to-blue-200',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-800'
    };
  }

  // Thunderstorm
  if (weather === 'thunderstorm' || description.includes('thunder')) {
    return {
      gradient: 'bg-gradient-to-br from-purple-600 via-blue-600 to-gray-700',
      iconColor: 'text-yellow-300',
      textColor: 'text-white',
      animation: 'animate-pulse'
    };
  }

  // Snow
  if (weather === 'snow' || description.includes('snow')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-100 via-white to-gray-100',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-800'
    };
  }

  // Mist/Fog
  if (weather === 'mist' || weather === 'fog' || description.includes('mist') || description.includes('fog')) {
    return {
      gradient: 'bg-gradient-to-br from-gray-200 via-gray-100 to-blue-100',
      iconColor: 'text-gray-500',
      textColor: 'text-gray-700'
    };
  }

  // Default (clear)
  return {
    gradient: 'bg-gradient-to-br from-sky-200 via-blue-100 to-white',
    iconColor: 'text-sky-500',
    textColor: 'text-sky-800'
  };
};

export const getWeatherIcon = (weatherMain: string, weatherDescription: string) => {
  const weather = weatherMain?.toLowerCase() || '';
  const description = weatherDescription?.toLowerCase() || '';

  if (weather === 'clear' || description.includes('clear')) return 'Sun';
  if (weather === 'rain' || description.includes('rain')) return 'CloudRain';
  if (weather === 'clouds') {
    if (description.includes('partly') || description.includes('few')) return 'CloudSun';
    return 'Cloud';
  }
  if (weather === 'thunderstorm') return 'Zap';
  if (weather === 'snow') return 'Snowflake';
  if (weather === 'mist' || weather === 'fog') return 'CloudDrizzle';
  
  return 'CloudSun';
};