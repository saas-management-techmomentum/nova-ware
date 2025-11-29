import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserRole {
  company_id: string;
  role: 'admin' | 'manager' | 'employee';
  approval_status: string;
}

export const useUserRolesQuery = () => {
  const { user, isAuthReady } = useAuth();
  
  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('company_users')
        .select('company_id, role, approval_status')
        .eq('user_id', user.id)
        .eq('approval_status', 'approved');

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      return (data || []) as UserRole[];
    },
    enabled: !!user?.id && isAuthReady,
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    gcTime: 10 * 60 * 1000,
  });
};
