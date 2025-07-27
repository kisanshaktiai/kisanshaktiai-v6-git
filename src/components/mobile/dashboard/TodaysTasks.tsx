
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Lock } from 'lucide-react';

interface Task {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'in-progress' | 'locked';
}

export const TodaysTasks: React.FC = () => {
  const { t } = useTranslation('dashboard');

  const tasks: Task[] = [
    {
      id: '1',
      time: '08:00 AM',
      title: 'Watering',
      subtitle: 'field A',
      status: 'in-progress'
    },
    {
      id: '2',
      time: '12:00 PM',
      title: 'Planting',
      subtitle: 'cabbage',
      status: 'locked'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
            On-Progress
          </span>
        );
      case 'locked':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center">
            <Lock className="w-3 h-3 mr-1" />
            Lock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Today's Tasks</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-gray-50 border-0">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(task.status)}
                <span className="text-sm font-medium text-gray-600">{task.time}</span>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.subtitle}</p>
              </div>
              
              <div className="pt-2">
                {getStatusBadge(task.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
