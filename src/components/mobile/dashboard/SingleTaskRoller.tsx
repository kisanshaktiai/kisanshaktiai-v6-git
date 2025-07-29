import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Play, Pause } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    title: 'Water the crops', // Will be translated below
    status: 'urgent',
    description: 'Field A needs immediate watering', // Will be translated below
    priority: 'high'
  },
  {
    id: '2',
    time: '11:00 AM',
    title: 'Check pest traps', // Will be translated below
    status: 'pending',
    description: 'Weekly inspection of all traps', // Will be translated below
    priority: 'medium'
  },
  {
    id: '3',
    time: '4:00 PM',
    title: 'Harvest tomatoes', // Will be translated below
    status: 'pending',
    description: 'Section C is ready for harvest', // Will be translated below
    priority: 'medium'
  },
  {
    id: '4',
    time: '6:00 PM',
    title: 'Equipment maintenance', // Will be translated below
    status: 'pending',
    description: 'Check tractor engine oil', // Will be translated below
    priority: 'low'
  }
];

export const SingleTaskRoller: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isAutoRolling, setIsAutoRolling] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Translate mock tasks
  const translatedTasks: Task[] = mockTasks.map(task => ({
    ...task,
    title: task.id === '1' ? t('tasks.examples.waterCrops') :
           task.id === '2' ? t('tasks.examples.checkPestTraps') :
           task.id === '3' ? t('tasks.examples.harvestTomatoes') :
           task.id === '4' ? t('tasks.examples.equipmentMaintenance') : task.title,
    description: task.id === '1' ? t('tasks.descriptions.fieldWatering') :
                 task.id === '2' ? t('tasks.descriptions.trapInspection') :
                 task.id === '3' ? t('tasks.descriptions.harvestReady') :
                 task.id === '4' ? t('tasks.descriptions.tractorMaintenance') : task.description
  }));

  // Filter out completed tasks for rolling display
  const activeTasks = translatedTasks.filter(task => task.status !== 'completed');
  const currentTask = activeTasks[currentTaskIndex];

  // Auto-roll functionality
  useEffect(() => {
    if (!isAutoRolling || isPaused || activeTasks.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTaskIndex((prev) => (prev + 1) % activeTasks.length);
    }, 4000); // 4 seconds per task

    return () => clearInterval(interval);
  }, [isAutoRolling, isPaused, activeTasks.length]);

  const nextTask = useCallback(() => {
    setCurrentTaskIndex((prev) => (prev + 1) % activeTasks.length);
  }, [activeTasks.length]);

  const prevTask = useCallback(() => {
    setCurrentTaskIndex((prev) => (prev - 1 + activeTasks.length) % activeTasks.length);
  }, [activeTasks.length]);

  const handleTaskClick = useCallback(() => {
    // Navigate to AI schedule page with task context
    navigate('/crop-schedule', { state: { selectedTask: currentTask } });
  }, [navigate, currentTask]);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      completed: 'bg-success/10 text-success border-success/20',
      urgent: 'bg-destructive/10 text-destructive border-destructive/20',
      pending: 'bg-primary/10 text-primary border-primary/20'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs px-2 py-0.5 ${variants[status]} border animate-fade-in`}
      >
        {status}
      </Badge>
    );
  };

  const getPriorityGlow = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'shadow-lg shadow-destructive/20 border-destructive/30';
      case 'medium':
        return 'shadow-lg shadow-warning/20 border-warning/30';
      case 'low':
        return 'shadow-lg shadow-success/20 border-success/30';
      default:
        return 'shadow-lg shadow-primary/20 border-primary/30';
    }
  };

  if (activeTasks.length === 0) {
    return (
      <Card className="mx-4 mb-4 bg-card/50 backdrop-blur-sm border border-border/50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="text-muted-foreground">{t('tasks.allCompleted')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 mb-4 bg-card/80 backdrop-blur-md border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-foreground">
            {t('dashboard.tasks.title', 'Today\'s Tasks')}
          </h3>
          <Badge variant="outline" className="text-xs">
            {activeTasks.length} {t('common.active')}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsAutoRolling(!isAutoRolling)}
          >
            {isAutoRolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCurrentTaskIndex(0)}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Task Display */}
      <CardContent className="px-4 pb-4">
        <Card 
          className={`p-4 border-l-4 ${getPriorityGlow(currentTask.priority)} 
                     hover:shadow-xl transition-all duration-300 cursor-pointer 
                     bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm
                     animate-scale-in hover:scale-[1.02]`}
          onClick={handleTaskClick}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-start justify-between space-x-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {getStatusIcon(currentTask.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {currentTask.title}
                  </h4>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0 font-medium">
                    {currentTask.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {currentTask.description}
                </p>
                <div className="flex items-center justify-between">
                  {getStatusBadge(currentTask.status)}
                  <div className="text-xs text-muted-foreground">
                    {t('tasks.tapToViewSchedule')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation Controls */}
        {activeTasks.length > 1 && (
          <div className="flex items-center justify-between mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={prevTask}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Progress Dots */}
            <div className="flex items-center space-x-1">
              {activeTasks.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentTaskIndex 
                      ? 'bg-primary scale-125' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  onClick={() => setCurrentTaskIndex(index)}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={nextTask}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};