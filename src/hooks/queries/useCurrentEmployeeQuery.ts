import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentEmployee {
  id: string;
  name: string;
  email?: string;
  position?: string;
  department?: string;
  assigned_warehouse_id?: string;
  page_permissions?: Record<string, boolean>;
}

export const useCurrentEmployeeQuery = () => {
  const { user, isAuthReady } = useAuth();
  
  return useQuery({
    queryKey: ['current-employee', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, position, department, assigned_warehouse_id, page_permissions')
        .eq('user_id_auth', user.id)
        .maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching employee data:', error);
        }
        return null;
      }

      return data as CurrentEmployee | null;
    },
    enabled: !!user?.id && isAuthReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};
