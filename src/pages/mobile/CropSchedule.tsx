
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export const CropSchedule: React.FC = () => {
  const { t } = useTranslation();

  const mockTasks = [
    {
      id: 1,
      title: t('schedule.waterWheatField'),
      crop: 'Wheat',
      field: 'Field 1',
      dueDate: '2025-01-16',
      priority: 'high',
      status: 'pending',
    },
    {
      id: 2,
      title: t('schedule.applyFertilizer'),
      crop: 'Rice',
      field: 'Field 2',
      dueDate: '2025-01-18',
      priority: 'medium',
      status: 'pending',
    },
    {
      id: 3,
      title: t('schedule.harvestInspection'),
      crop: 'Wheat',
      field: 'Field 1',
      dueDate: '2025-01-20',
      priority: 'low',
      status: 'completed',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    return status === 'completed' ? 'secondary' : 'default';
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('schedule.title')}
          </h1>
          <p className="text-gray-600">{t('schedule.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">2</div>
            <div className="text-sm text-gray-600">{t('schedule.pending')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">1</div>
            <div className="text-sm text-gray-600">{t('schedule.completed')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">1</div>
            <div className="text-sm text-gray-600">{t('schedule.overdue')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('schedule.upcomingTasks')}</h2>
        {mockTasks.map((task) => (
          <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                  <Badge variant={getStatusVariant(task.status)}>
                    {task.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('schedule.crop')}:</span>
                <span className="font-medium">{task.crop}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('schedule.field')}:</span>
                <span className="font-medium">{task.field}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {t('schedule.dueDate')}:
                </div>
                <span className="font-medium">{task.dueDate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
