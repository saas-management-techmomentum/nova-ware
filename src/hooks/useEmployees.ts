import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { defaultPagePermissions, PagePermissions } from '@/hooks/usePagePermissions';

export interface Employee {
  id: string;
  name: string;
  position?: string;
  role?: string;
  initials?: string;
  email?: string;
  user_id: string;
  user_id_auth?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  invited_at?: string;
  employee_id?: string;
  department?: string;
  start_date?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  pay_type?: 'hourly' | 'salary';
  hourly_rate?: number;
  annual_salary?: number;
  tax_withholding_status?: 'single' | 'married' | 'head-of-household';
  health_insurance_amount?: number;
  dental_insurance_amount?: number;
  retirement_401k_amount?: number;
  other_deductions_amount?: number;
  assigned_warehouse_id?: string;
  page_permissions?: PagePermissions;
  avatar_url?: string;
}

export interface AddEmployeeData {
  name: string;
  position: string;
  role?: string;
  initials?: string;
  email?: string;
  createAccount?: boolean;
  employee_id?: string;
  department?: string;
  start_date?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  pay_type?: 'hourly' | 'salary';
  hourly_rate?: number;
  annual_salary?: number;
  tax_withholding_status?: 'single' | 'married' | 'head-of-household';
  federal_withholding?: number;
  state_withholding?: number;
  social_security_rate?: number;
  medicare_rate?: number;
  health_insurance_amount?: number;
  dental_insurance_amount?: number;
  retirement_401k_amount?: number;
  other_deductions_amount?: number;
  assigned_warehouse_id?: string;
  page_permissions?: PagePermissions;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getPrimaryCompanyId, isAdmin, warehouseAssignments, userRoles, loading: permissionsLoading } = useUserPermissions();

  const fetchEmployees = async () => {
    // Wait for permissions to load before fetching
    if (!user?.id || permissionsLoading) return;

    try {
      let query = supabase.from('employees').select('*');
      
      // Check if user has company-level manager or admin role
      const isCompanyManager = userRoles.some(role => role.role === 'manager' || role.role === 'admin');
      
      if (isAdmin || isCompanyManager) {
        // Admins and company-level managers see all employees in their companies
        const { data: companyIds } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id);
        
        if (companyIds && companyIds.length > 0) {
          const companyIdList = companyIds.map(c => c.company_id);
          query = query.in('company_id', companyIdList);
        } else {
          // Fallback to original filter
          query = query.or(`user_id.eq.${user.id},user_id_auth.eq.${user.id}`);
        }
      } else {
        // For warehouse-level managers and employees
        const managerWarehouseIds = warehouseAssignments
          .filter(w => w.role === 'manager' || w.role === 'admin')
          .map(w => w.warehouse_id);
        
        if (managerWarehouseIds.length > 0) {
          // Warehouse managers see employees in warehouses they manage
          query = query.or(`user_id.eq.${user.id},user_id_auth.eq.${user.id},assigned_warehouse_id.in.(${managerWarehouseIds.join(',')})`);
        } else {
          // Regular employees only see employees they created + their own record
          query = query.or(`user_id.eq.${user.id},user_id_auth.eq.${user.id}`);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }


      // Type the data properly to handle database schema differences
      const typedEmployees = (data || []).map(emp => ({
        ...emp,
        pay_type: emp.pay_type as 'hourly' | 'salary' | undefined,
        tax_withholding_status: emp.tax_withholding_status as 'single' | 'married' | 'head-of-household' | undefined,
        hourly_rate: emp.hourly_rate ? Number(emp.hourly_rate) : undefined,
        health_insurance_amount: emp.health_insurance_amount ? Number(emp.health_insurance_amount) : undefined,
        dental_insurance_amount: emp.dental_insurance_amount ? Number(emp.dental_insurance_amount) : undefined,
        retirement_401k_amount: emp.retirement_401k_amount ? Number(emp.retirement_401k_amount) : undefined,
        other_deductions_amount: emp.other_deductions_amount ? Number(emp.other_deductions_amount) : undefined,
        page_permissions: (emp.page_permissions as unknown) as PagePermissions | undefined,
      })) as Employee[];

      setEmployees(typedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: AddEmployeeData) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Use our new default permissions
      const finalPermissions = employeeData.page_permissions || defaultPagePermissions;
      const companyId = getPrimaryCompanyId();
      
      const { data, error } = await supabase
        .from('employees')
        .insert({
          name: employeeData.name,
          position: employeeData.position,
          role: employeeData.role || 'employee',
          initials: employeeData.initials,
          email: employeeData.email,
          user_id: user.id,
          company_id: companyId,
          status: 'pending',
          employee_id: employeeData.employee_id,
          department: employeeData.department,
          start_date: employeeData.start_date,
          phone: employeeData.phone,
          address: employeeData.address,
          emergency_contact_name: employeeData.emergency_contact_name,
          emergency_contact_phone: employeeData.emergency_contact_phone,
          pay_type: employeeData.pay_type,
          hourly_rate: employeeData.hourly_rate ? Number(employeeData.hourly_rate) : null,
          tax_withholding_status: employeeData.tax_withholding_status,
          health_insurance_amount: employeeData.health_insurance_amount ? Number(employeeData.health_insurance_amount) : null,
          dental_insurance_amount: employeeData.dental_insurance_amount ? Number(employeeData.dental_insurance_amount) : null,
          retirement_401k_amount: employeeData.retirement_401k_amount ? Number(employeeData.retirement_401k_amount) : null,
          other_deductions_amount: employeeData.other_deductions_amount ? Number(employeeData.other_deductions_amount) : null,
          assigned_warehouse_id: employeeData.assigned_warehouse_id,
          page_permissions: finalPermissions as any,
          invited_at: employeeData.createAccount ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding employee:', error);
        throw error;
      }

   

      // Create warehouse_users entry if warehouse is assigned
      if (employeeData.assigned_warehouse_id) {
        try {
          const warehouseRole = employeeData.role === 'manager' ? 'manager' : 'staff';
          
          // Note: user_id_auth will be null initially, but the trigger will handle this
          // when the employee accepts the invitation and user_id_auth gets populated
  
        } catch (error) {
          console.error('Error creating warehouse assignment:', error);
          // Don't fail the entire operation for this
        }
      }

      // If createAccount is true and email is provided, send invitation
      if (employeeData.createAccount && employeeData.email && data.id && companyId) {
        try {
          // Get company name for the invitation
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('id', companyId)
            .single();

          // Get warehouse name if assigned
          let warehouseName;
          if (employeeData.assigned_warehouse_id) {
            const { data: warehouseData } = await supabase
              .from('warehouses')
              .select('name')
              .eq('id', employeeData.assigned_warehouse_id)
              .single();
            warehouseName = warehouseData?.name;
          }



          const { error: inviteError } = await supabase.functions.invoke('invite-employee', {
            body: {
              employeeId: data.id,
              email: employeeData.email,
              temporaryPassword: null, // Let the function generate a secure password
              companyId: companyId,
              companyName: companyData?.name || 'Your Company',
              role: employeeData.role === 'manager' ? 'manager' : 'employee',
              warehouseId: employeeData.assigned_warehouse_id,
              warehouseName: warehouseName
            }
          });

          if (inviteError) {
            console.error('Error sending invitation:', inviteError);
            toast({
              title: "Warning",
              description: "Employee added but invitation email failed to send",
              variant: "destructive",
            });
          } 
        } catch (inviteError) {
          console.error('Error invoking invite function:', inviteError);
          toast({
            title: "Warning", 
            description: "Employee added but invitation email failed to send",
            variant: "destructive",
          });
        }
      }

      await fetchEmployees();
      
      toast({
        title: "Success",
        description: `Employee ${employeeData.name} added successfully${employeeData.createAccount ? ' and invitation sent' : ''}`,
      });

      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const processedUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
        hourly_rate: updates.hourly_rate ? Number(updates.hourly_rate) : updates.hourly_rate,
        health_insurance_amount: updates.health_insurance_amount ? Number(updates.health_insurance_amount) : updates.health_insurance_amount,
        dental_insurance_amount: updates.dental_insurance_amount ? Number(updates.dental_insurance_amount) : updates.dental_insurance_amount,
        retirement_401k_amount: updates.retirement_401k_amount ? Number(updates.retirement_401k_amount) : updates.retirement_401k_amount,
        other_deductions_amount: updates.other_deductions_amount ? Number(updates.other_deductions_amount) : updates.other_deductions_amount,
        page_permissions: updates.page_permissions as any,
      };

      const { data, error } = await supabase
        .from('employees')
        .update(processedUpdates)
        .eq('id', employeeId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Employee not found or you do not have permission to update this employee');
      }

      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee?.email) return;
    
    try {
      const companyId = getPrimaryCompanyId();
      
      // Get company name for the invitation
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      // Get warehouse name if assigned
      let warehouseName;
      if (employee.assigned_warehouse_id) {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('name')
          .eq('id', employee.assigned_warehouse_id)
          .single();
        warehouseName = warehouseData?.name;
      }

      const { error } = await supabase.functions.invoke('invite-employee', {
        body: {
          employeeId: employee.id,
          email: employee.email,
          temporaryPassword: null, // Let the function generate a secure password
          companyId: companyId,
          companyName: companyData?.name || 'Your Company',
          role: employee.role === 'manager' ? 'manager' : 'employee',
          warehouseId: employee.assigned_warehouse_id,
          warehouseName: warehouseName
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const assignEmployeeToWarehouse = async (employeeId: string, warehouseId: string) => {
    try {
      const { data, error } = await supabase.rpc('assign_employee_to_warehouse' as any, {
        employee_uuid: employeeId,
        warehouse_uuid: warehouseId
      });

      if (error) throw error;

      if (data) {
        // Update local state
        setEmployees(prev => prev.map(emp => 
          emp.id === employeeId ? { ...emp, assigned_warehouse_id: warehouseId } : emp
        ));
        toast({
          title: "Success",
          description: "Employee assigned to warehouse successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to assign employee to warehouse",
          variant: "destructive",
        });
      }

      return data;
    } catch (error: any) {
      console.error('Error assigning employee to warehouse:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign employee to warehouse",
        variant: "destructive",
      });
      throw error;
    }
  };

  // COMMENTED OUT: RPC functions not available in database
  // These functions would need to be created via migration
  /*
  const promoteEmployeeToManager = async (employeeId: string, warehouseId: string) => {
    // Requires: promote_employee_to_manager RPC function
    return null;
  };

  const demoteManagerToEmployee = async (employeeId: string, warehouseId: string) => {
    // Requires: demote_manager_to_employee RPC function
    return null;
  };

  const getEffectiveRole = async (employeeId: string): Promise<string> => {
    // Requires: get_effective_role RPC function
    return 'employee';
  };
  */

  useEffect(() => {
    if (user?.id && !permissionsLoading) {
      fetchEmployees();
    }
  }, [user?.id, isAdmin, warehouseAssignments, userRoles, permissionsLoading]);

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    removeEmployee: deleteEmployee,
    resendInvitation,
    assignEmployeeToWarehouse,
    // COMMENTED OUT: RPC functions not available
    // promoteEmployeeToManager,
    // demoteManagerToEmployee,
    // getEffectiveRole,
    refreshEmployees: fetchEmployees
  };
};
