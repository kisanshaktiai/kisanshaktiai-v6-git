
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  }
];

export const TenantTasksSection: React.FC = () => {
  const { t } = useTranslation();

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      completed: 'bg-green-100 text-green-700',
      urgent: 'bg-red-100 text-red-700',
      pending: 'bg-blue-100 text-blue-700'
    };

    return (
      <Badge variant="secondary" className={`text-xs ${variants[status]}`}>
        {t(`dashboard.tasks.status.${status}`, status)}
      </Badge>
    );
  };

  return (
    <Card className="mx-4 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t('dashboard.tasks.title', "Today's Tasks")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {mockTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(task.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                  {getStatusBadge(task.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {task.description}
                  </p>
                  <span className="text-xs text-muted-foreground ml-2">
                    {task.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
