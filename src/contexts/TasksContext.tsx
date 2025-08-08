
import React, { createContext, useContext, ReactNode } from 'react';
import { useWarehouseScopedTasks, Task } from '@/hooks/useWarehouseScopedTasks';

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  startTask: (id: string) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const tasksData = useWarehouseScopedTasks();

  return (
    <TasksContext.Provider value={tasksData}>
      {children}
    </TasksContext.Provider>
  );
};
