
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDataScope, getAccessibleWarehouses, testRLSPolicies, type UserDataScope, type AccessibleWarehouse } from '@/utils/rlsUtils';

export const useRLSContext = () => {
  const { user, isAuthReady } = useAuth();
  const [dataScope, setDataScope] = useState<UserDataScope | null>(null);
  const [accessibleWarehouses, setAccessibleWarehouses] = useState<AccessibleWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [rlsTestResults, setRlsTestResults] = useState<any>(null);

  const fetchRLSContext = async () => {
    if (!isAuthReady || !user?.id) {
      setLoading(false);
      return;
    }

    try {

      
      // Get user's data access scope
      const scope = await getUserDataScope();
      setDataScope(scope);
      
      // Get accessible warehouses
      const warehouses = await getAccessibleWarehouses();
      setAccessibleWarehouses(warehouses);
      

      
    } catch (error) {
      console.error('Error fetching RLS context:', error);
      setDataScope(null);
      setAccessibleWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const runRLSTests = async () => {

    const results = await testRLSPolicies();
    setRlsTestResults(results);
    return results;
  };

  const refreshRLSContext = async () => {
    setLoading(true);
    await fetchRLSContext();
  };

  useEffect(() => {
    fetchRLSContext();
  }, [isAuthReady, user?.id]);

  return {
    dataScope,
    accessibleWarehouses,
    loading,
    rlsTestResults,
    runRLSTests,
    refreshRLSContext,
    // Utility functions
    hasCompanyAccess: (companyId: string) => dataScope?.company_ids.includes(companyId) || false,
    hasAdminAccess: (companyId: string) => dataScope?.admin_company_ids.includes(companyId) || false,
    hasWarehouseAccess: (warehouseId: string) => accessibleWarehouses.some(w => w.warehouse_id === warehouseId),
    getWarehouseAccessLevel: (warehouseId: string) => accessibleWarehouses.find(w => w.warehouse_id === warehouseId)?.access_level || null,
    isMultiCompanyAdmin: dataScope?.is_multi_company_admin || false
  };
};
