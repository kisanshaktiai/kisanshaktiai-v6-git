
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CloudSun, Droplets, Wind, Sun, CloudRain, Cloud, Zap, 
  Snowflake, CloudDrizzle, Clock, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEnhancedWeatherData } from '@/hooks/useEnhancedWeatherData';
import { getWeatherBackground, getWeatherIcon } from '@/utils/weatherBackgrounds';

interface Task {
  id: string;
  time: string;
  title: string;
  status: 'pending' | 'completed' | 'urgent';
  description?: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    time: '9:00 AM',
    title: 'Water the crops',
    status: 'urgent',
    description: 'Field A needs watering'
  },
  {
    id: '2',
    time: '11:00 AM', 
    title: 'Check pest traps',
    status: 'pending',
    description: 'Weekly inspection'
  },
  {
    id: '3',
    time: '2:00 PM',
    title: 'Apply fertilizer',
    status: 'completed',
    description: 'Field B - NPK application'
  },
  {
    id: '4',
    time: '4:00 PM',
    title: 'Harvest tomatoes',
    status: 'pending',
    description: 'Section C ready'
  }
];

export const TenantWeatherCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentWeather, loading } = useEnhancedWeatherData();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Auto-rotate tasks every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaskIndex((prev) => (prev + 1) % mockTasks.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'urgent':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      completed: 'bg-green-100 text-green-700',
      urgent: 'bg-red-100 text-red-700',
      pending: 'bg-blue-100 text-blue-700'
    };

    return (
      <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 ${variants[status]}`}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="mx-4 mb-2 h-32">
        <CardContent className="p-3">
          <div className="animate-pulse">
            <div className="h-3 bg-muted rounded w-1/3 mb-2"></div>
            <div className="flex items-center justify-between mb-2">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded-full w-8"></div>
            </div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const weatherBackground = getWeatherBackground(
    currentWeather?.weather_main || 'Clear',
    currentWeather?.weather_description || 'Sunny'
  );

  const WeatherIcon = (() => {
    const iconName = getWeatherIcon(
      currentWeather?.weather_main || 'Clear',
      currentWeather?.weather_description || 'Sunny'
    );
    const icons = { Sun, CloudRain, Cloud, CloudSun, Zap, Snowflake, CloudDrizzle };
    return icons[iconName as keyof typeof icons] || CloudSun;
  })();

  const currentTask = mockTasks[currentTaskIndex];

  const nextTask = () => {
    setCurrentTaskIndex((prev) => (prev + 1) % mockTasks.length);
  };

  const prevTask = () => {
    setCurrentTaskIndex((prev) => (prev - 1 + mockTasks.length) % mockTasks.length);
  };

  return (
    <Card className={`mx-4 mb-2 h-32 border-0 overflow-hidden ${weatherBackground.gradient}`}>
      <CardContent className="p-3 h-full">
        {/* Weather Section */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <WeatherIcon className={`w-6 h-6 ${weatherBackground.iconColor} ${weatherBackground.animation || ''}`} />
              <div className={`text-lg font-bold ${weatherBackground.textColor}`}>
                {Math.round(currentWeather?.temperature_celsius || 28)}°C
              </div>
            </div>
            <div className={`text-xs ${weatherBackground.textColor} opacity-80 capitalize`}>
              {currentWeather?.weather_description || t('dashboard.weather.sunny', 'Sunny')}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1 text-xs">
            <div className={`flex items-center space-x-1 ${weatherBackground.textColor} opacity-70`}>
              <Droplets className="w-3 h-3" />
              <span>{currentWeather?.humidity_percent || 65}%</span>
            </div>
            <div className={`flex items-center space-x-1 ${weatherBackground.textColor} opacity-70`}>
              <Wind className="w-3 h-3" />
              <span>{Math.round(currentWeather?.wind_speed_kmh || 12)} km/h</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px ${weatherBackground.textColor} opacity-20 mb-2`}></div>

        {/* Rolling Tasks Section */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevTask}
            className={`p-1 rounded-full ${weatherBackground.textColor} opacity-50 hover:opacity-80 transition-opacity`}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          
          <div className="flex-1 mx-2 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className={`text-xs font-medium ${weatherBackground.textColor} truncate flex-1`}>
                {currentTask?.title || 'No tasks'}
              </div>
              {currentTask && (
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(currentTask.status)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-xs ${weatherBackground.textColor} opacity-70 truncate flex-1`}>
                {currentTask?.description || 'All tasks completed'}
              </div>
              {currentTask && (
                <div className={`text-xs ${weatherBackground.textColor} opacity-70 ml-2 flex-shrink-0`}>
                  {currentTask.time}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={nextTask}
            className={`p-1 rounded-full ${weatherBackground.textColor} opacity-50 hover:opacity-80 transition-opacity`}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Task indicators */}
        <div className="flex justify-center space-x-1 mt-2">
          {mockTasks.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                index === currentTaskIndex 
                  ? `${weatherBackground.textColor} opacity-80` 
                  : `${weatherBackground.textColor} opacity-30`
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
