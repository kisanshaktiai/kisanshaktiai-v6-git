
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Droplets,
  Sprout,
  Scissors,
  Beaker,
  Bug,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CalendarCheck
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'sowing' | 'watering' | 'fertilizer' | 'pesticide' | 'harvest' | 'soilTest' | 'pruning' | 'weeding';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue';
  dueDate: string;
  field?: string;
  crop?: string;
}

const TaskIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    sowing: Sprout,
    watering: Droplets,
    fertilizer: Beaker,
    pesticide: Bug,
    harvest: Scissors,
    soilTest: Beaker,
    pruning: Scissors,
    weeding: Scissors,
    default: Calendar
  };
  
  const Icon = icons[type as keyof typeof icons] || icons.default;
  return <Icon className={className} />;
};

export const SeasonalCalendar: React.FC = () => {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'thisWeek' | 'overdue'>('all');

  const mockTasks: Task[] = [
    {
      id: '1',
      title: t('tasks.watering'),
      description: t('schedule.waterWheatField'),
      type: 'watering',
      priority: 'high',
      status: 'pending',
      dueDate: 'Today',
      field: 'Field A',
      crop: 'Wheat'
    },
    {
      id: '2',
      title: t('tasks.fertilizer'),
      description: t('schedule.applyFertilizer'),
      type: 'fertilizer',
      priority: 'medium',
      status: 'pending',
      dueDate: 'Tomorrow',
      field: 'Field B',
      crop: 'Rice'
    },
    {
      id: '3',
      title: t('tasks.monitoring'),
      description: t('schedule.harvestInspection'),
      type: 'harvest',
      priority: 'low',
      status: 'completed',
      dueDate: 'Yesterday',
      field: 'Field C',
      crop: 'Corn'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'overdue': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredTasks = mockTasks.filter(task => {
    switch (selectedFilter) {
      case 'today': return task.dueDate === 'Today';
      case 'thisWeek': return ['Today', 'Tomorrow'].includes(task.dueDate);
      case 'overdue': return task.status === 'overdue';
      default: return true;
    }
  });

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-xl overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 tracking-tight">
                {t('calendar.thisWeek')}
              </CardTitle>
              <p className="text-sm text-gray-600 font-medium mt-1">
                {t('calendar.upcomingTasks')}
              </p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
            <CalendarCheck className="w-3 h-3 mr-1" />
            {filteredTasks.length}
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {[
            { key: 'all', label: t('common.viewAll') },
            { key: 'today', label: t('calendar.today') },
            { key: 'thisWeek', label: t('calendar.thisWeek') },
            { key: 'overdue', label: t('calendar.overdue') }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(key as any)}
              className={`whitespace-nowrap text-xs font-medium transition-all duration-200 ${
                selectedFilter === key 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-700 border-gray-200'
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {t('calendar.noTasks')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('calendar.allCaughtUp')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task, index) => {
              const StatusIcon = getStatusIcon(task.status);
              
              return (
                <div
                  key={task.id}
                  className="p-4 hover:bg-gray-50/70 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start space-x-4">
                    {/* Task Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <TaskIcon type={task.type} className="w-5 h-5 text-gray-600" />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-200">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors duration-200 flex-shrink-0 ml-2" />
                      </div>

                      {/* Task Metadata */}
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                        
                        {task.field && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{task.field}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {t(`schedule.${task.priority}`, task.priority)}
                          </Badge>
                          
                          <div className={`flex items-center space-x-1 ${getStatusColor(task.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {t(`calendar.${task.status}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        {filteredTasks.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
            <Button 
              variant="outline" 
              className="w-full text-green-700 border-green-200 hover:bg-green-50 font-medium"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('common.viewCalendar')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
