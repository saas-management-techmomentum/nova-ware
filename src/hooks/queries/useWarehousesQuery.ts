import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AccessibleWarehouse {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  access_level: string;
  company_id: string;
}

export const useWarehousesQuery = () => {
  const { user, isAuthReady } = useAuth();
  
  return useQuery({
    queryKey: ['accessible-warehouses', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_accessible_warehouses');

      if (error) {
        console.error('Error fetching accessible warehouses:', error);
        throw error;
      }

      return (data || []) as AccessibleWarehouse[];
    },
    enabled: !!user?.id && isAuthReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};
