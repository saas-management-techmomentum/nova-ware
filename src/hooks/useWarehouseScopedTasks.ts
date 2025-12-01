
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  assigned_by?: string;
  warehouse_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  start_time?: string;
  pause_time?: string;
  resume_time?: string;
  completed_at?: string;
  total_duration?: number;
  is_paused?: boolean;
  time_tracking_status?: 'not_started' | 'in_progress' | 'paused' | 'completed';
}

export const useWarehouseScopedTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, warehouses } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { userRoles } = useUserPermissions();

  const fetchTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get companyId from warehouses
      const companyId = warehouses.length > 0 ? warehouses[0].company_id : null;
      const isAdmin = userRoles.some(role => role.role === 'admin');
      
      
      // Simple query - let RLS policies handle access control
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filtering based on user role and selection
      if (selectedWarehouse) {
        // Specific warehouse selected - filter by warehouse
        query = query.eq('warehouse_id', selectedWarehouse);
      } else if (isAdmin && !selectedWarehouse && companyId) {
        // Admin with "All Warehouses" (Corporate View) - show all tasks for company
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }
      
      // Transform data to ensure proper typing
      const transformedTasks: Task[] = (data || []).map(task => ({
        ...task,
        status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
        time_tracking_status: task.time_tracking_status as 'not_started' | 'in_progress' | 'paused' | 'completed' || 'not_started'
      }));
      
      setTasks(transformedTasks);
    } catch (error) {
      console.error('Exception fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    // Determine warehouse based on user role
    const isAdmin = userRoles.some(role => role.role === 'admin');
    const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
    const warehouseToUse = isAdmin ? selectedWarehouse : currentEmployee?.assigned_warehouse_id;
    
    if (!warehouseToUse) return null;

    try {
      // Get the company_id for the warehouse
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('company_id')
        .eq('id', warehouseToUse)
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          assigned_by: user.id,
          warehouse_id: warehouseToUse,
          company_id: warehouseData?.company_id,
          time_tracking_status: 'not_started'
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchTasks();
      return {
        ...data,
        status: data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: data.priority as 'low' | 'medium' | 'high' | 'urgent'
      } as Task;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedWarehouse, user]);

  const logTaskAction = async (taskId: string, action: string, previousState: any, newState: any) => {
    try {
      await supabase
        .from('task_audit_log')
        .insert([{
          task_id: taskId,
          user_id: user?.id,
          action,
          previous_state: previousState,
          new_state: newState,
        }]);
    } catch (error) {
      console.error('Error logging task action:', error);
    }
  };

  const startTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const now = new Date().toISOString();
      const updates = {
        start_time: now,
        time_tracking_status: 'in_progress',
        is_paused: false,
        status: 'in_progress',
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await logTaskAction(id, 'start', task, { ...task, ...updates });
      await fetchTasks();
    } catch (error) {
      console.error('Error starting task:', error);
      throw error;
    }
  };

  const pauseTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task || !task.start_time) return;

      const now = new Date().toISOString();
      const startTime = new Date(task.start_time);
      const currentTime = new Date(now);
      const sessionDuration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000);
      
      const updates = {
        pause_time: now,
        time_tracking_status: 'paused' as const,
        is_paused: true,
        total_duration: (task.total_duration || 0) + sessionDuration,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await logTaskAction(id, 'pause', task, { ...task, ...updates });
      await fetchTasks();
    } catch (error) {
      console.error('Error pausing task:', error);
      throw error;
    }
  };

  const resumeTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const now = new Date().toISOString();
      const updates = {
        resume_time: now,
        start_time: now,
        time_tracking_status: 'in_progress' as const,
        is_paused: false,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await logTaskAction(id, 'resume', task, { ...task, ...updates });
      await fetchTasks();
    } catch (error) {
      console.error('Error resuming task:', error);
      throw error;
    }
  };

  const completeTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const now = new Date().toISOString();
      let finalDuration = task.total_duration || 0;

      if (task.start_time && !task.is_paused) {
        const startTime = new Date(task.start_time);
        const currentTime = new Date(now);
        const sessionDuration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000);
        finalDuration += sessionDuration;
      }

      const updates = {
        completed_at: now,
        time_tracking_status: 'completed' as const,
        status: 'completed' as const,
        total_duration: finalDuration,
        is_paused: false,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await logTaskAction(id, 'complete', task, { ...task, ...updates });
      await fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
  };
};
