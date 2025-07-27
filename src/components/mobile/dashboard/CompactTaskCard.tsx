
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, Calendar, MapPin } from 'lucide-react';

export const CompactTaskCard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);

  const todaysTasks = [
    {
      id: 1,
      title: 'Water wheat field',
      description: 'Check soil moisture and irrigate if needed',
      time: '08:00 AM',
      priority: 'high',
      status: 'pending',
      field: 'North Field A',
      estimatedDuration: '2 hours'
    },
    {
      id: 2,
      title: 'Apply fertilizer',
      description: 'NPK fertilizer application for corn crop',
      time: '10:30 AM',
      priority: 'medium',
      status: 'pending',
      field: 'South Field B',
      estimatedDuration: '1.5 hours'
    },
    {
      id: 3,
      title: 'Harvest inspection',
      description: 'Check tomato ripeness for harvest readiness',
      time: '02:00 PM',
      priority: 'low',
      status: 'scheduled',
      field: 'Greenhouse 1',
      estimatedDuration: '45 minutes'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const visibleTasks = isExpanded ? todaysTasks : todaysTasks.slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="px-4">
        <h3 className="text-lg font-semibold text-foreground">{t('tasks.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('tasks.subtitle')}</p>
      </div>

      <div className="px-4 space-y-2">
        {visibleTasks.map((task, index) => {
          const StatusIcon = getStatusIcon(task.status);
          
          return (
            <Card key={task.id} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      <StatusIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                          {t(`tasks.priority.${task.priority}`)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{task.field}</span>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Duration: {task.estimatedDuration}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              {t('tasks.markComplete')}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs h-7">
                              {t('tasks.reschedule')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {todaysTasks.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center space-x-2 text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>{t('actions.viewLess')}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>{t('tasks.expandTasks')} ({todaysTasks.length - 2} more)</span>
              </>
            )}
          </Button>
        )}

        {todaysTasks.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('tasks.noTasks')}</p>
            <p className="text-xs text-muted-foreground">{t('tasks.allCaughtUp')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
