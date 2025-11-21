import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string; // 'pending' | 'completed'
  due_date?: string;
  priority: string; // 'low' | 'medium' | 'high'
  assigned_to?: string;
  assigned_by?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  // Add computed properties for compatibility
  completed: boolean;
  category: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch tasks from database
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error loading tasks",
          description: "Failed to load tasks from database",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedTasks: Task[] = (data || []).map(task => ({
        ...task,
        completed: task.status === 'completed',
        category: task.priority || 'medium', // Use priority as category fallback
      }));

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      toast({
        title: "Error loading tasks",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new task
  const addTask = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: string;
    due_date?: string;
    assigned_to?: string;
    assigned_by?: string;
    warehouse_id?: string;
    company_id?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to add tasks",
          variant: "destructive",
        });
        return;
      }

      // Get user's company_id
      let userCompanyId = taskData.company_id || null;
      if (!userCompanyId) {
        try {
          const { data: companyData } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();
          
          userCompanyId = companyData?.company_id || null;
        } catch (error) {
          console.log('No company found for user, using null');
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.due_date,
          priority: taskData.priority,
          assigned_to: taskData.assigned_to || null,
          assigned_by: taskData.assigned_by || user.id,
          status: taskData.status || 'pending',
          company_id: userCompanyId,
          warehouse_id: taskData.warehouse_id || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        toast({
          title: "Error adding task",
          description: "Failed to add task to database",
          variant: "destructive",
        });
        return;
      }

      // Transform and add to state
      const transformedTask: Task = {
        ...data,
        completed: data.status === 'completed',
        category: data.priority || 'medium',
      };

      setTasks(prev => [transformedTask, ...prev]);
      toast({
        title: "Task added",
        description: "New task has been added successfully",
      });
    } catch (error) {
      console.error('Error in addTask:', error);
      toast({
        title: "Error adding task",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Update task
  const updateTask = async (id: string, updates: Partial<{
    title: string;
    description: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    assigned_to?: string;
    completed: boolean;
    status: string;
  }>) => {
    try {
      // Transform updates to match database schema
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assigned_to !== undefined) dbUpdates.assigned_to = updates.assigned_to;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      else if (updates.completed !== undefined) dbUpdates.status = updates.completed ? 'completed' : 'pending';

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        toast({
          title: "Error updating task",
          description: "Failed to update task in database",
          variant: "destructive",
        });
        return;
      }

      // Transform and update state
      const transformedTask: Task = {
        ...data,
        completed: data.status === 'completed',
        category: data.priority || 'medium',
      };

      setTasks(prev => prev.map(task => task.id === id ? transformedTask : task));
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
    } catch (error) {
      console.error('Error in updateTask:', error);
      toast({
        title: "Error updating task",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Error deleting task",
          description: "Failed to delete task from database",
          variant: "destructive",
        });
        return;
      }

      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: "Task deleted",
        description: "Task has been removed successfully",
      });
    } catch (error) {
      console.error('Error in deleteTask:', error);
      toast({
        title: "Error deleting task",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await updateTask(id, { completed: !task.completed });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refetch: fetchTasks,
  };
};
