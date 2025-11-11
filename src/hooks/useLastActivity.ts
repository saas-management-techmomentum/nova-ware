
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export const useLastActivity = () => {
  const { data: lastActivity, isLoading } = useQuery({
    queryKey: ['lastActivity'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return null;
      }

      // Get the most recent activity from various tables
      const queries = await Promise.allSettled([
        // Orders activity
        supabase
          .from('orders')
          .select('created_at, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single(),
          
        // Products/Inventory activity  
        supabase
          .from('products')
          .select('created_at, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single(),
          
        // Tasks activity
        supabase
          .from('tasks')
          .select('created_at, updated_at')
          .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single(),
          
        // Inventory history activity
        supabase
          .from('inventory_history')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
          
        // Billing transactions activity
        supabase
          .from('billing_transactions')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      // Extract timestamps from successful queries
      const timestamps: Date[] = [];
      
      queries.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const data = result.value.data;
          if (data.created_at) timestamps.push(new Date(data.created_at));
          if ('updated_at' in data && data.updated_at) timestamps.push(new Date(data.updated_at));
        } else if (result.status === 'rejected') {
          // Silently log rejected queries (missing tables, empty results)
          const error = result.reason;
          if (error?.code !== 'PGRST116') {
            // PGRST116 = no rows, which is expected
            console.debug(`Activity query ${index} failed:`, error?.message || error);
          }
        }
      });

      // Find the most recent timestamp
      if (timestamps.length === 0) {
        return null;
      }

      const mostRecent = new Date(Math.max(...timestamps.map(d => d.getTime())));
      
      return {
        timestamp: mostRecent,
        relativeTime: formatDistanceToNow(mostRecent, { addSuffix: true })
      };
    },
    refetchInterval: 60000, // Refetch every minute to keep it current
  });

  return {
    lastActivity,
    isLoading
  };
};
