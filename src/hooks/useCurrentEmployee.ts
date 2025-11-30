import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentEmployee {
  id: string;
  name: string;
  user_id_auth: string;
}

export const useCurrentEmployee = () => {
  const { user } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState<CurrentEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      if (!user?.id) {
        setCurrentEmployee(null);
        setLoading(false);
        return;
      }

      try {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('id, name, user_id_auth')
          .eq('user_id_auth', user.id)
          .single();

        if (error) {
         
          setCurrentEmployee(null);
        } else {
          setCurrentEmployee(employee);
        }
      } catch (error) {
        console.error('Error fetching current employee:', error);
        setCurrentEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentEmployee();
  }, [user?.id]);

  return { currentEmployee, loading };
};