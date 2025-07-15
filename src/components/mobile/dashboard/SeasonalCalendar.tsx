
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sprout, 
  Droplets, 
  Bug, 
  Scissors,
  Calendar
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'sowing' | 'fertilizer' | 'pest' | 'harvest' | 'festival';
  title: string;
  description: string;
  landName?: string;
  crop?: string;
}

export const SeasonalCalendar: React.FC = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const events: CalendarEvent[] = [
    {
      id: '1',
      date: new Date(2024, 11, 20),
      type: 'sowing',
      title: t('calendar.sowing', 'Wheat Sowing'),
      description: t('calendar.sowingDesc', 'Plant wheat seeds in Field 1'),
      landName: 'Field 1',
      crop: 'Wheat'
    },
    {
      id: '2',
      date: new Date(2024, 11, 22),
      type: 'fertilizer',
      title: t('calendar.fertilizer', 'NPK Application'),
      description: t('calendar.fertilizerDesc', 'Apply NPK fertilizer to tomato crop'),
      landName: 'Field 2',
      crop: 'Tomato'
    },
    {
      id: '3',
      date: new Date(2024, 11, 25),
      type: 'pest',
      title: t('calendar.pestControl', 'Pest Control'),
      description: t('calendar.pestControlDesc', 'Spray for aphids prevention'),
      landName: 'Field 1',
      crop: 'Wheat'
    },
    {
      id: '4',
      date: new Date(2024, 11, 30),
      type: 'harvest',
      title: t('calendar.harvest', 'Rice Harvest'),
      description: t('calendar.harvestDesc', 'Harvest ready rice crop'),
      landName: 'Field 3',
      crop: 'Rice'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sowing': return <Sprout className="w-4 h-4 text-green-600" />;
      case 'fertilizer': return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'pest': return <Bug className="w-4 h-4 text-red-600" />;
      case 'harvest': return <Scissors className="w-4 h-4 text-orange-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'sowing': return 'bg-green-100 text-green-800 border-green-200';
      case 'fertilizer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pest': return 'bg-red-100 text-red-800 border-red-200';
      case 'harvest': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const upcomingEvents = events.filter(event => 
    event.date >= new Date() && event.date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="px-4 py-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{t('dashboard.seasonalCalendar', 'This Week\'s Tasks')}</span>
            </div>
            <Button variant="ghost" size="sm">
              {t('common.viewCalendar', 'View Calendar')}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {event.title}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getEventColor(event.type)}`}
                    >
                      {formatDate(event.date)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    {event.description}
                  </p>
                  
                  {event.landName && (
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>📍 {event.landName}</span>
                      {event.crop && <span>🌾 {event.crop}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {t('calendar.noEvents', 'No upcoming tasks this week')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
