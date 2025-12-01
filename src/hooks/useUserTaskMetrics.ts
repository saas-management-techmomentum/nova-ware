import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserTaskMetrics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  is_user_specific: boolean;
}

export const useUserTaskMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userTaskMetrics', user?.id],
    queryFn: async (): Promise<UserTaskMetrics> => {
      if (!user) {
        throw new Error('User not authenticated');
      }


      
      const { data, error } = await supabase.rpc('get_user_task_metrics', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error fetching user task metrics:', error);
        throw error;
      }

   
      
      // Safely convert the JSON response to UserTaskMetrics
      const metrics = data as unknown as UserTaskMetrics;
      
      // Validate that we have the expected structure
      if (!metrics || typeof metrics !== 'object') {
        throw new Error('Invalid task metrics data received from database');
      }

      return metrics;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};