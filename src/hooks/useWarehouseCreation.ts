
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export interface WarehouseFormData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
}

export const useWarehouseCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshWarehouses, setSelectedWarehouse } = useWarehouse();
  const { isAdmin, getPrimaryCompanyId, refreshPermissions } = useUserPermissions();

  const createWarehouse = async (data: WarehouseFormData) => {
    setIsLoading(true);
    
    try {


      // Enhanced validation with new constraints
      if (!user?.id) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to create a warehouse.',
          variant: 'destructive'
        });
        return false;
      }

      if (!isAdmin) {
        toast({
          title: 'Insufficient Permissions',
          description: 'Only company admins can create warehouses.',
          variant: 'destructive'
        });
        return false;
      }

      const companyId = getPrimaryCompanyId();
      if (!companyId) {
        toast({
          title: 'No Company Access',
          description: 'You must be assigned to a company as an admin to create warehouses.',
          variant: 'destructive'
        });
        return false;
      }

      // Create warehouse with enhanced data integrity
      const warehouseData = {
        ...data,
        manager_id: user.id,
        company_id: companyId,
        is_active: true
      };
      
  

      const { data: newWarehouse, error: warehouseError } = await supabase
        .from('warehouses')
        .insert([warehouseData])
        .select()
        .single();

      if (warehouseError) {
        console.error('Warehouse creation error:', warehouseError);
        
        // Enhanced error handling for new constraints
        if (warehouseError.code === '42501') {
          toast({
            title: 'Permission Denied',
            description: 'Unable to create warehouse. Please verify your admin permissions.',
            variant: 'destructive'
          });
        } else if (warehouseError.code === '23505') {
          if (warehouseError.message.includes('warehouses_code_key')) {
            toast({
              title: 'Duplicate Warehouse Code',
              description: `A warehouse with code "${data.code}" already exists.`,
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Duplicate Entry',
              description: 'This warehouse configuration already exists.',
              variant: 'destructive'
            });
          }
        } else if (warehouseError.code === '23503') {
          toast({
            title: 'Invalid Company',
            description: 'The company assignment is invalid. Please refresh and try again.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Creation Failed',
            description: `Failed to create warehouse: ${warehouseError.message}`,
            variant: 'destructive'
          });
        }
        return false;
      }

      if (!newWarehouse) {
        toast({
          title: 'Creation Failed',
          description: 'Warehouse was not created properly. Please try again.',
          variant: 'destructive'
        });
        return false;
      }



      // Create warehouse-user relationship with enhanced error handling
      try {
        const { error: warehouseUserError } = await supabase
          .from('warehouse_users')
          .insert([{
            warehouse_id: newWarehouse.id,
            user_id: user.id,
            role: 'manager'
          }]);

        if (warehouseUserError) {
          console.error('Warehouse-user relationship error:', warehouseUserError);
          
          // Handle specific constraint violations
          if (warehouseUserError.code === '23505') {
          
          } else if (warehouseUserError.message?.includes('User cannot be assigned to warehouse in different company')) {
            toast({
              title: 'Assignment Error',
              description: 'User cannot be assigned to warehouse in different company.',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Warning',
              description: 'Warehouse created but failed to assign user access.',
              variant: 'default'
            });
          }
        }
      } catch (assignmentError) {
        console.error('Warehouse assignment error:', assignmentError);
        toast({
          title: 'Warning',
          description: 'Warehouse created but there was an issue with user assignment.',
          variant: 'default'
        });
      }

      toast({
        title: 'Success',
        description: `Warehouse "${data.name}" created successfully!`
      });

      // Refresh data
      await refreshWarehouses();
      await refreshPermissions();
      
      if (newWarehouse) {
        setSelectedWarehouse(newWarehouse.id);
      }
      
      return true;

    } catch (error) {
      console.error('Warehouse creation exception:', error);
      
      // Handle specific database constraint errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          toast({
            title: 'Duplicate Entry',
            description: 'A warehouse with this code or configuration already exists.',
            variant: 'destructive'
          });
        } else if (error.message.includes('violates foreign key constraint')) {
          toast({
            title: 'Invalid Reference',
            description: 'There was an issue with the company or user assignment.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Unexpected Error',
            description: error.message || 'An unexpected error occurred. Please try again.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createWarehouse,
    isLoading,
    isAdmin
  };
};
