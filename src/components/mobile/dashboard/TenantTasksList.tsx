import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  time: string;
  title: string;
  status: 'pending' | 'completed' | 'urgent';
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

const mockTasks: Task[] = [
  {
    id: '1',
    time: '9:00 AM',
    title: 'Water the crops',
    status: 'urgent',
    description: 'Field A needs immediate watering',
    priority: 'high'
  },
  {
    id: '2',
    time: '11:00 AM',
    title: 'Check pest traps',
    status: 'pending',
    description: 'Weekly inspection of all traps',
    priority: 'medium'
  },
  {
    id: '3',
    time: '2:00 PM',
    title: 'Apply fertilizer',
    status: 'completed',
    description: 'Field B - NPK application completed',
    priority: 'high'
  },
  {
    id: '4',
    time: '4:00 PM',
    title: 'Harvest tomatoes',
    status: 'pending',
    description: 'Section C is ready for harvest',
    priority: 'medium'
  },
  {
    id: '5',
    time: '6:00 PM',
    title: 'Equipment maintenance',
    status: 'pending',
    description: 'Check tractor engine oil',
    priority: 'low'
  },
  {
    id: '6',
    time: '7:00 AM (Tomorrow)',
    title: 'Soil testing',
    status: 'pending',
    description: 'pH testing for field C',
    priority: 'medium'
  }
];

export const TenantTasksList: React.FC = () => {
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
      completed: 'bg-green-100 text-green-700 border-green-200',
      urgent: 'bg-red-100 text-red-700 border-red-200',
      pending: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
      <Badge 
        variant="secondary" 
        className={`text-xs px-2 py-0.5 ${variants[status]} border`}
      >
        {status}
      </Badge>
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400';
      case 'medium':
        return 'border-l-yellow-400';
      case 'low':
        return 'border-l-green-400';
      default:
        return 'border-l-gray-300';
    }
  };

  return (
    <Card className="mx-4 mb-4 bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            {t('dashboard.tasks.title', 'Today\'s Tasks')}
          </h3>
          <Badge variant="outline" className="text-xs">
            {mockTasks.filter(task => task.status !== 'completed').length} pending
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
          {mockTasks.map((task) => (
            <Card 
              key={task.id} 
              className={`p-3 border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow cursor-pointer bg-card/50`}
            >
              <div className="flex items-start justify-between space-x-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {getStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {task.title}
                      </h4>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {task.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(task.status)}
                      {task.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-3 text-sm h-9"
        >
          {t('dashboard.tasks.viewAll', 'View All Tasks')}
        </Button>
      </CardContent>
    </Card>
  );
};