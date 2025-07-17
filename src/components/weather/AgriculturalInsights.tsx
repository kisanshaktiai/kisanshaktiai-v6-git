import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Sprout, 
  Droplets, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Thermometer,
  Wind,
  Eye
} from 'lucide-react';

interface WeatherData {
  temperature_celsius: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  evapotranspiration_mm: number;
  soil_temperature_celsius: number;
  soil_moisture_percent: number;
  growing_degree_days: number;
  weather_main: string;
}

interface AgriculturalInsightsProps {
  weather: WeatherData;
  detailed?: boolean;
}

interface SprayRecommendation {
  score: number;
  recommendation: string;
  color: string;
  reasons: string[];
  optimal_time: string;
}

export const AgriculturalInsights: React.FC<AgriculturalInsightsProps> = ({ 
  weather, 
  detailed = false 
}) => {
  const { t } = useTranslation();
  const { profile, location } = useSelector((state: RootState) => state.farmer);
  const [sprayRecommendation, setSprayRecommendation] = useState<SprayRecommendation | null>(null);
  const [irrigationNeed, setIrrigationNeed] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Calculate spray suitability score
  const calculateSprayScore = () => {
    let score = 100;

    // Temperature penalties
    if (weather.temperature_celsius < 10 || weather.temperature_celsius > 35) {
      score -= 30;
    } else if (weather.temperature_celsius < 15 || weather.temperature_celsius > 30) {
      score -= 15;
    }

    // Wind speed penalties
    if (weather.wind_speed_kmh > 15) {
      score -= 25;
    } else if (weather.wind_speed_kmh > 10) {
      score -= 10;
    }

    // Humidity penalties
    if (weather.humidity_percent > 85) {
      score -= 20;
    } else if (weather.humidity_percent < 30) {
      score -= 15;
    }

    return Math.max(0, score);
  };

  // Calculate irrigation requirements
  const calculateIrrigationNeed = () => {
    const baseNeed = weather.evapotranspiration_mm || 0;
    const soilMoisture = weather.soil_moisture_percent || 50;
    const temperature = weather.temperature_celsius || 25;

    // Adjust based on soil moisture
    let adjustedNeed = baseNeed;
    if (soilMoisture < 30) {
      adjustedNeed *= 1.5; // Increase need for dry soil
    } else if (soilMoisture > 70) {
      adjustedNeed *= 0.5; // Reduce need for moist soil
    }

    // Adjust for temperature
    if (temperature > 35) {
      adjustedNeed *= 1.2; // More water needed in high heat
    }

    return Math.round(adjustedNeed * 10) / 10;
  };

  // Get spray recommendations
  const getSprayRecommendations = async () => {
    if (!location || !profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('weather-alerts', {
        body: {
          latitude: location.latitude,
          longitude: location.longitude,
          farmer_id: profile.id
        }
      });

      if (data && data.spray_recommendation) {
        setSprayRecommendation(data.spray_recommendation);
      }
    } catch (error) {
      console.error('Error getting spray recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSprayRecommendations();
    setIrrigationNeed(calculateIrrigationNeed());
  }, [weather, location, profile]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 40) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const sprayScore = calculateSprayScore();

  return (
    <div className="space-y-6">
      {/* Agricultural Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>{t('weather.evapotranspiration', 'Evapotranspiration')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {weather.evapotranspiration_mm || 0} mm
            </div>
            <p className="text-xs text-gray-600">
              {t('weather.waterLossToday', 'Water loss today')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Sprout className="w-4 h-4 text-green-500" />
              <span>{t('weather.growingDegreeDays', 'Growing Degree Days')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {weather.growing_degree_days || 0}
            </div>
            <p className="text-xs text-gray-600">
              {t('weather.heatUnitsToday', 'Heat units accumulated today')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span>{t('weather.soilTemperature', 'Soil Temperature')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {weather.soil_temperature_celsius || 0}°C
            </div>
            <p className="text-xs text-gray-600">
              {t('weather.soilTemp', 'Current soil temperature')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spray Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>{t('weather.sprayRecommendations', 'Spray Recommendations')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getScoreIcon(sprayScore)}
              <div>
                <div className="font-semibold">
                  {t('weather.sprayingSuitability', 'Spraying Suitability')}
                </div>
                <div className={`text-sm ${getScoreColor(sprayScore)}`}>
                  {sprayRecommendation?.recommendation || 
                    (sprayScore >= 80 ? 'Excellent' : 
                     sprayScore >= 60 ? 'Good' : 
                     sprayScore >= 40 ? 'Fair' : 'Poor')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(sprayScore)}`}>
                {sprayScore}%
              </div>
              <Progress value={sprayScore} className="w-20 mt-1" />
            </div>
          </div>

          {/* Spray Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.temperature', 'Temperature')}</div>
                <div className={`font-semibold ${
                  weather.temperature_celsius >= 10 && weather.temperature_celsius <= 35 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {weather.temperature_celsius}°C
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.windSpeed', 'Wind Speed')}</div>
                <div className={`font-semibold ${
                  weather.wind_speed_kmh <= 15 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {weather.wind_speed_kmh} km/h
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.humidity', 'Humidity')}</div>
                <div className={`font-semibold ${
                  weather.humidity_percent >= 30 && weather.humidity_percent <= 85 
                    ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {weather.humidity_percent}%
                </div>
              </div>
            </div>
          </div>

          {/* Reasons */}
          {sprayRecommendation?.reasons && sprayRecommendation.reasons.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">
                {t('weather.considerations', 'Considerations')}:
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {sprayRecommendation.reasons.map((reason, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="text-red-500">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Irrigation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span>{t('weather.irrigationRecommendations', 'Irrigation Recommendations')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t('weather.waterRequirement', 'Water Requirement')}</div>
              <div className="text-sm text-gray-600">
                {t('weather.basedOnET', 'Based on evapotranspiration and soil conditions')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {irrigationNeed} mm
              </div>
              <div className="text-sm text-gray-600">
                {t('weather.recommended', 'Recommended')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-600 mb-1">
                {t('weather.soilMoisture', 'Soil Moisture')}
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={weather.soil_moisture_percent || 50} className="flex-1" />
                <span className="font-semibold">{weather.soil_moisture_percent || 50}%</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">
                {t('weather.irrigationTiming', 'Best Irrigation Time')}
              </div>
              <div className="font-semibold">
                {weather.temperature_celsius > 30 
                  ? t('weather.earlyMorningEvening', 'Early morning or evening')
                  : t('weather.anytime', 'Anytime')
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights */}
      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>{t('weather.farmingInsights', 'Farming Insights')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Disease Risk */}
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">
                  {t('weather.diseaseRisk', 'Disease Risk Assessment')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('weather.fungalDiseases', 'Fungal Diseases')}</span>
                    <Badge variant={weather.humidity_percent > 80 ? 'destructive' : 'secondary'}>
                      {weather.humidity_percent > 80 ? t('weather.high', 'High') : t('weather.low', 'Low')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('weather.pestActivity', 'Pest Activity')}</span>
                    <Badge variant={weather.temperature_celsius > 25 ? 'destructive' : 'secondary'}>
                      {weather.temperature_celsius > 25 ? t('weather.high', 'High') : t('weather.moderate', 'Moderate')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Field Work Suitability */}
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">
                  {t('weather.fieldWorkSuitability', 'Field Work Suitability')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('weather.harvesting', 'Harvesting')}</span>
                    <Badge variant={weather.weather_main.toLowerCase() !== 'rain' ? 'secondary' : 'destructive'}>
                      {weather.weather_main.toLowerCase() !== 'rain' ? t('weather.suitable', 'Suitable') : t('weather.notSuitable', 'Not Suitable')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('weather.sowing', 'Sowing')}</span>
                    <Badge variant={weather.soil_temperature_celsius > 15 ? 'secondary' : 'outline'}>
                      {weather.soil_temperature_celsius > 15 ? t('weather.good', 'Good') : t('weather.wait', 'Wait')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather-based Recommendations */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3 text-gray-800">
                {t('weather.todayRecommendations', 'Today\'s Recommendations')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm">
                  {weather.humidity_percent > 80 && (
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{t('weather.monitorDisease', 'Monitor crops for disease symptoms')}</span>
                    </li>
                  )}
                  {weather.temperature_celsius > 35 && (
                    <li className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t('weather.avoidMidday', 'Avoid field work during midday hours')}</span>
                    </li>
                  )}
                  {weather.wind_speed_kmh > 20 && (
                    <li className="flex items-start space-x-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>{t('weather.secureEquipment', 'Secure loose equipment and structures')}</span>
                    </li>
                  )}
                </ul>
                
                <ul className="space-y-2 text-sm">
                  {irrigationNeed > 3 && (
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{t('weather.increaseIrrigation', 'Consider increasing irrigation frequency')}</span>
                    </li>
                  )}
                  {sprayScore >= 80 && (
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{t('weather.excellentSpray', 'Excellent conditions for spraying operations')}</span>
                    </li>
                  )}
                  {weather.growing_degree_days > 0 && (
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{t('weather.cropDevelopment', 'Good conditions for crop development')}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};