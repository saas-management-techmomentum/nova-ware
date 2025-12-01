import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export interface Client {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  contact_person?: string;
  tax_id?: string;
  business_type?: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  payment_terms_days?: number;
  resale_certificate_url?: string;
  warehouse_id?: string;
  company_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useWarehouseScopedClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, warehouses } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { isAdmin, userRoles } = useUserPermissions();

  // Get employee assigned warehouse
  const getEmployeeAssignedWarehouse = () => {
    if (!user?.id) return null;
    
    // Check if user is admin or manager - they see all warehouses
    const canManageEmployees = userRoles.some(role => role.role === 'admin' || role.role === 'manager');
    if (isAdmin || canManageEmployees) return null;
    
    // Find employee record and get assigned warehouse
    const currentEmployee = employees.find(emp => emp.user_id_auth === user.id);
    return currentEmployee?.assigned_warehouse_id || null;
  };

  const fetchClients = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get companyId from warehouses
      const companyId = warehouses.length > 0 ? warehouses[0].company_id : null;
      
      console.log('Fetching clients for warehouse:', selectedWarehouse || 'all warehouses');
      console.log('User ID:', user.id);
      console.log('Company ID:', companyId);
      
      // Get employee info to check for warehouse assignment
      const { data: employeeData } = await supabase
        .from('employees')
        .select('assigned_warehouse_id')
        .eq('user_id_auth', user.id)
        .maybeSingle();

      const { data: userRoleData } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', user.id);

      const isUserAdmin = userRoleData?.some(role => role.role === 'admin') || false;
      const isAssignedEmployee = employeeData?.assigned_warehouse_id && !isUserAdmin;

      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filtering logic based on user type
      if (isAssignedEmployee) {
        // Warehouse-assigned employees see ALL clients for their assigned warehouse
        console.log('Filtering clients by assigned warehouse:', employeeData.assigned_warehouse_id);
        query = query.eq('warehouse_id', employeeData.assigned_warehouse_id);
      } else if (isUserAdmin && selectedWarehouse) {
        // Admin with warehouse selected - show all clients for that warehouse
        console.log('Admin: Filtering clients by selected warehouse:', selectedWarehouse);
        query = query.eq('warehouse_id', selectedWarehouse);
      } else if (isUserAdmin && !selectedWarehouse && companyId) {
        // Admin with "All Warehouses" (Corporate View) - show all clients for company
        console.log('Admin: Showing all clients for company:', companyId);
        query = query.eq('company_id', companyId);
      } else {
        // Unassigned employee - show only their own clients
        console.log('Unassigned employee: Showing only own clients');
        query = query.eq('user_id', user.id);
        if (selectedWarehouse) {
          query = query.eq('warehouse_id', selectedWarehouse);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }
      
      console.log('Clients fetched:', { count: data?.length || 0 });
      setClients(data || []);
    } catch (error) {
      console.error('Exception fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Client | null> => {
    if (!user) return null;

    try {
      // Get warehouse to assign based on user role
      const employeeAssignedWarehouse = getEmployeeAssignedWarehouse();
      const warehouseToAssign = isAdmin ? selectedWarehouse : employeeAssignedWarehouse;

      // Get company_id from the selected/assigned warehouse
      const selectedWarehouseData = warehouses.find(w => w.warehouse_id === warehouseToAssign);
      const companyId = selectedWarehouseData?.company_id;
      
      // Validation: Ensure we have a company_id
      if (!companyId) {
        console.error('No company_id found for warehouse:', warehouseToAssign);
        throw new Error('Could not determine company for this client');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          user_id: user.id,
          warehouse_id: warehouseToAssign,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        throw error;
      }

      await fetchClients(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Exception adding client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<void> => {
    try {
      console.log('Updating client with ID:', id);
      console.log('Updates:', updates);
      
      const { error, data } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select();

      console.log('Update response data:', data);
      console.log('Update response error:', error);

      if (error) {
        console.error('Error updating client:', error);
        throw error;
      }

      await fetchClients(); // Refresh the list
    } catch (error) {
      console.error('Exception updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client:', error);
        throw error;
      }

      await fetchClients(); // Refresh the list
    } catch (error) {
      console.error('Exception deleting client:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [selectedWarehouse, user, employees, userRoles]);

  return {
    clients,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
};