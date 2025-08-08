import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Task } from '@/hooks/useWarehouseScopedTasks';

interface TimeTrackingButtonsProps {
  task: Task;
  canUpdateTaskStatus?: boolean;
  warehouseId?: string;
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onResume: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export const TimeTrackingButtons: React.FC<TimeTrackingButtonsProps> = ({
  task,
  canUpdateTaskStatus = false,
  warehouseId,
  onStart,
  onPause,
  onResume,
  onComplete,
}) => {
  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (task.time_tracking_status === 'in_progress' && task.start_time && !task.is_paused) {
      interval = setInterval(() => {
        const startTime = new Date(task.start_time!);
        const now = new Date();
        const sessionTime = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        setCurrentDuration((task.total_duration || 0) + sessionTime);
      }, 60000); // Update every minute
    } else {
      setCurrentDuration(task.total_duration || 0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task.time_tracking_status, task.start_time, task.is_paused, task.total_duration]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderTimeDisplay = () => {
    if (task.time_tracking_status === 'completed') {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDuration(task.total_duration || 0)}
        </div>
      );
    }

    if (task.time_tracking_status === 'in_progress' || task.time_tracking_status === 'paused') {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDuration(currentDuration)}
          {task.time_tracking_status === 'in_progress' && !task.is_paused && (
            <span className="animate-pulse text-green-500">●</span>
          )}
        </div>
      );
    }

    return null;
  };

  const renderButtons = () => {
    // If user cannot update task status, only show status
    if (!canUpdateTaskStatus) {
      switch (task.time_tracking_status) {
        case 'not_started':
          return (
            <div className="text-sm text-muted-foreground font-medium">
              Not Started
            </div>
          );
        case 'in_progress':
          return task.is_paused ? (
            <div className="text-sm text-yellow-600 font-medium">
              ⏸ Paused
            </div>
          ) : (
            <div className="text-sm text-blue-600 font-medium">
              ▶ In Progress
            </div>
          );
        case 'paused':
          return (
            <div className="text-sm text-yellow-600 font-medium">
              ⏸ Paused
            </div>
          );
        case 'completed':
          return (
            <div className="text-sm text-green-600 font-medium">
              ✓ Completed
            </div>
          );
        default:
          return null;
      }
    }

    // Full time tracking controls for task assignees
    switch (task.time_tracking_status) {
      case 'not_started':
        return (
          <Button
            onClick={() => onStart(task.id)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-3 w-3 mr-1" />
            Start Task
          </Button>
        );

      case 'in_progress':
        if (task.is_paused) {
          return (
            <div className="flex gap-2">
              <Button
                onClick={() => onResume(task.id)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
              <Button
                onClick={() => onComplete(task.id)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-3 w-3 mr-1" />
                Complete
              </Button>
            </div>
          );
        } else {
          return (
            <div className="flex gap-2">
              <Button
                onClick={() => onPause(task.id)}
                size="sm"
                variant="outline"
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
              <Button
                onClick={() => onComplete(task.id)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-3 w-3 mr-1" />
                Complete
              </Button>
            </div>
          );
        }

      case 'paused':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onResume(task.id)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
            <Button
              onClick={() => onComplete(task.id)}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="h-3 w-3 mr-1" />
              Complete
            </Button>
          </div>
        );

      case 'completed':
        return (
          <div className="text-sm text-green-600 font-medium">
            ✓ Completed
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {renderTimeDisplay()}
      {renderButtons()}
    </div>
  );
};