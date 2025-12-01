import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { toast } from '@/hooks/use-toast';

export interface PalletProduct {
  sku: string;
  name: string;
  upc: string;
  qty: number;
  product_id: string;
}

export interface PalletLocation {
  id: string;
  location: string;
  products: PalletProduct[];
  lastUpdated: string;
}

export const usePalletLocations = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { selectedWarehouse, warehouses } = useWarehouse();
  const [pallets, setPallets] = useState<PalletLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPallets = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get employee info to check for warehouse assignment
      const { data: employees } = await supabase
        .from('employees')
        .select('assigned_warehouse_id')
        .eq('user_id_auth', user.id)
        .maybeSingle();

      const { data: userRoles } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => role.role === 'admin') || false;
      const isAssignedEmployee = employees?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      // Fetch pallet locations
      let palletQuery = supabase
        .from('pallet_locations')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filtering logic based on user type
      if (isAssignedEmployee) {
        // Warehouse-assigned employees see ALL pallets for their assigned warehouse
        palletQuery = palletQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else if (!isAdmin) {
        // Only non-admin, non-assigned employees see their own pallets
        palletQuery = palletQuery.eq('user_id', user.id);
      }
      // Admins see all locations in their company (RLS handles company filtering)

      const { data: palletData, error: palletError } = await palletQuery;
      if (palletError) throw palletError;

      // Fetch pallet products with product details
      let productQuery = supabase
        .from('pallet_products')
        .select(`
          *,
          products (
            name,
            sku,
            upc
          )
        `);

      // Apply filtering based on user type
      if (isAssignedEmployee) {
        productQuery = productQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else if (!isAdmin) {
        productQuery = productQuery.eq('user_id', user.id);
      }
      // Admins see all products in their company (RLS handles filtering)

      const { data: productData, error: productError } = await productQuery;
      if (productError) throw productError;

      // Combine pallet locations with their products
      const transformedPallets: PalletLocation[] = palletData.map(pallet => {
        const palletProducts = productData
          .filter(pp => pp.pallet_id === pallet.id)
          .map(pp => ({
            sku: pp.products?.sku || '',
            name: pp.products?.name || '',
            upc: pp.products?.upc || '',
            qty: pp.quantity,
            product_id: pp.product_id
          }));

        return {
          id: pallet.id,
          location: pallet.location,
          products: palletProducts,
          lastUpdated: new Date(pallet.updated_at).toISOString().split('T')[0]
        };
      });

      setPallets(transformedPallets);
    } catch (error) {
      console.error('Error fetching pallets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pallet locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLocationIdExists = async (locationId: string): Promise<boolean> => {
    if (!user?.id || !locationId.trim()) return false;

    try {
      const { data, error } = await supabase
        .from('pallet_locations')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', locationId.trim())
        .limit(1);

      if (error) {
        console.error('Error checking location ID:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking location ID:', error);
      return false;
    }
  };

  const generateUniqueLocationId = async (baseId?: string): Promise<string> => {
    if (!user?.id) return 'LOC-001';

    const prefix = baseId?.replace(/\d+$/, '') || 'LOC-';
    let counter = 1;
    let newId = `${prefix}${counter.toString().padStart(3, '0')}`;

    // Keep incrementing until we find a unique ID
    while (await checkLocationIdExists(newId)) {
      counter++;
      newId = `${prefix}${counter.toString().padStart(3, '0')}`;
      
      // Safety check to prevent infinite loops
      if (counter > 999) {
        newId = `${prefix}${Date.now()}`;
        break;
      }
    }

    return newId;
  };

  const addPallet = async (palletData: Omit<PalletLocation, 'lastUpdated'>) => {
    if (!user?.id) return;

    try {
      // Get company_id from the selected warehouse
      const selectedWarehouseData = warehouses.find(w => w.warehouse_id === selectedWarehouse);
      const companyId = selectedWarehouseData?.company_id;
      
      // Validation: Ensure we have a company_id
      if (!companyId) {
        console.error('No company_id found for warehouse:', selectedWarehouse);
        toast({
          title: "Error",
          description: "Could not determine company for this location. Please select a warehouse.",
          variant: "destructive",
        });
        return;
      }

      // Check if location ID already exists
      const exists = await checkLocationIdExists(palletData.id);
      if (exists) {
        throw new Error(`Location ID "${palletData.id}" already exists. Please choose a different ID.`);
      }

      // Insert pallet location
      const { error: palletError } = await supabase
        .from('pallet_locations')
        .insert({
          id: palletData.id,
          location: palletData.location,
          user_id: user.id,
          company_id: companyId,
          warehouse_id: selectedWarehouse
        });

      if (palletError) {
        // Handle specific constraint violation error
        if (palletError.code === '23505' && palletError.message.includes('pallet_locations_pkey')) {
          throw new Error(`Location ID "${palletData.id}" already exists. Please choose a different ID.`);
        }
        throw palletError;
      }

      // Insert pallet products
      if (palletData.products.length > 0) {
        const productInserts = palletData.products.map(product => ({
          pallet_id: palletData.id,
          product_id: product.product_id,
          quantity: product.qty,
          user_id: user.id,
          company_id: companyId,
          warehouse_id: selectedWarehouse
        }));

        const { error: productError } = await supabase
          .from('pallet_products')
          .insert(productInserts);

        if (productError) throw productError;
      }

      // Refresh the pallets list
      await fetchPallets();
      
      toast({
        title: "Location Added Successfully",
        description: `Location ${palletData.id} has been saved successfully`,
      });
    } catch (error) {
      console.error('Error adding pallet:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save pallet location";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPallets();
    }
  }, [user]);

  return {
    pallets,
    loading,
    fetchPallets,
    addPallet,
    checkLocationIdExists,
    generateUniqueLocationId,
  };
};
