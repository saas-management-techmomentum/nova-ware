import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ApprovalStatusData {
  approval_status: string | null;
  approved_at: string | null;
  approved_by: string | null;
  role: string;
  company_id: string;
}

export const useApprovalStatus = () => {
  const { user, isAuthReady } = useAuth();
  const [approvalData, setApprovalData] = useState<ApprovalStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApprovalStatus = async () => {
    if (!isAuthReady || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_users')
        .select('approval_status, approved_at, approved_by, role, company_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching approval status:', error);
        return;
      }

      setApprovalData(data);
    } catch (error) {
      console.error('Error in fetchApprovalStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalStatus();
  }, [isAuthReady, user?.id]);

  return {
    approvalStatus: approvalData?.approval_status,
    approvedAt: approvalData?.approved_at,
    approvedBy: approvalData?.approved_by,
    userRole: approvalData?.role,
    companyId: approvalData?.company_id,
    loading,
    refresh: fetchApprovalStatus
  };
};