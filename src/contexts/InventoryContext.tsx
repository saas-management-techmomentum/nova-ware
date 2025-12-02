
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useWarehouseScopedInventory } from '@/hooks/useWarehouseScopedInventory';
import { useInventoryRealtime } from '@/hooks/useInventoryRealtime';
import { InventoryItem as BaseInventoryItem, PredictionResult, InventoryTransaction } from '@/types/inventory';
import { generateInventoryPredictions, checkDataSufficiency } from '@/utils/inventoryPrediction';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from './WarehouseContext';
import { useAuth } from './AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, parseISO, isValid } from 'date-fns';

// Extend the base InventoryItem with additional context-specific properties
export interface InventoryItem extends BaseInventoryItem {
  user_id: string;
  created_at: Date;
  updated_at: Date;
  warehouse_id?: string;
  company_id?: string;
}

export interface Shipment {
  id: string;
  supplier: string;
  orderReference: string;
  expectedDate: string;
  receivedDate?: string;
  status: 'pending' | 'partially-received' | 'received' | 'inspected';
  items: {
    sku: string;
    name: string;
    expectedQty: number;
    receivedQty?: number;
    damagedQty?: number;
    notes?: string;
  }[];
}

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  isAddingProduct: boolean;
  refetch: () => void;
  addProduct: (product: any) => Promise<void>;
  updateProduct: (updatedProduct: InventoryItem) => void;
  deleteProduct: (id: string) => void;
  generatePredictions: () => PredictionResult[];
  processShipmentItems: (items: any[]) => Promise<{ createdProducts: string[]; updatedProducts: string[] } | void>;
  addInventoryTransaction: (transaction: any) => void;
  transactions: any[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  // For predictive analysis, ignore warehouse filtering to get ALL products
  const { inventoryItems: baseItems, isLoading, refetch } = useWarehouseScopedInventory(true);
  const { selectedWarehouse, warehouses } = useWarehouse();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { isAdmin, userRoles } = useUserPermissions();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const queryClient = useQueryClient();

  // Set up real-time updates
  useInventoryRealtime();

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

  // Map base items to inventory items with proper typing
  const inventoryItems: InventoryItem[] = baseItems.map(item => ({
    ...item,
    stock: item.stock || 0,
    user_id: (item as any).user_id || '',
    created_at: (item as any).created_at || new Date(),
    updated_at: (item as any).updated_at || new Date(),
    warehouse_id: (item as any).warehouse_id,
    company_id: (item as any).company_id,
  }));

  const addProduct = async (product: any) => {
    if (!user) {
      console.error('No user found');
      throw new Error('User not authenticated');
    }

    setIsAddingProduct(true);

    try {
      
      // Get warehouse and company info if warehouse is selected
      let warehouseId = selectedWarehouse;
      let companyId = null;
      
      if (selectedWarehouse) {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('company_id')
          .eq('id', selectedWarehouse)
          .single();
        
        companyId = warehouseData?.company_id;
      }

      // Transform the product data to match database schema
      const productData = {
        name: product.name,
        sku: product.sku,
        upc: product.upc || null,
        asin: product.asin || null,
        quantity: product.stock || 0, // Database uses 'quantity', UI uses 'stock'
        unit_price: product.unit_price || 0,
        cost_price: product.cost_price || 0,
        case_price: product.case_price || 0,
        case_cost: product.case_cost || 0,
        casesize: product.casesize || null,
        dimensions: product.dimensions || null,
        weight: product.weight || null,
        expiration: product.expiration || null,
        category: product.category || null,
        description: product.description || null,
        low_stock_threshold: product.low_stock_threshold ?? null,
        user_id: user.id,
        warehouse_id: warehouseId,
        company_id: companyId
      };


      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        throw error;
      }


      // Invalidate queries instead of manual refetch
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });

    } catch (error) {
      console.error('Exception adding product:', error);
      throw error;
    } finally {
      setIsAddingProduct(false);
    }
  };

  const updateProduct = async (updatedProduct: InventoryItem) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      
      // Transform and save to database
      const updateData = {
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        quantity: updatedProduct.stock, // Map stock to quantity
        unit_price: updatedProduct.unit_price || 0,
        cost_price: updatedProduct.cost_price || 0,
        case_price: updatedProduct.case_price || 0,
        case_cost: updatedProduct.case_cost || 0,
        upc: updatedProduct.upc,
        asin: updatedProduct.asin,
        dimensions: updatedProduct.dimensions,
        weight: updatedProduct.weight,
        category: updatedProduct.category,
        description: updatedProduct.description,
        expiration: updatedProduct.expiration?.toISOString(),
        low_stock_threshold: updatedProduct.low_stock_threshold,
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', updatedProduct.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

  
      
      // Invalidate queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
    } catch (error) {
      console.error('Exception updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }

      
      // Invalidate queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (error) {
      console.error('Exception deleting product:', error);
      throw error;
    }
  };

  const generatePredictions = (): PredictionResult[] => {

    
    // Use real transactions instead of mock data
    const realTransactions = transactions
      .map(t => {

        
        // Robust date parsing for Supabase timestamp format
        let date: Date;
        let dateString = t.created_at;
        
        // Handle various date formats from Supabase
        if (typeof dateString === 'string') {
          // Supabase returns timestamps like "2025-07-14 22:18:21.435544+00"
          // First try parseISO for standard ISO formats
          date = parseISO(dateString);
          
          // If parseISO fails, try new Date() constructor
          if (!isValid(date)) {
            date = new Date(dateString);
          }
          
          // If still invalid, try to clean up the timestamp format
          if (!isValid(date)) {
            // Remove microseconds if present and try again
            const cleanedDate = dateString.replace(/\.\d{6}/, '');
            date = new Date(cleanedDate);
          }
        } else if (dateString instanceof Date) {
          date = dateString;
        } else {
          // Try to convert to Date if it's a timestamp or other format
          date = new Date(dateString);
        }
        
        // Final validation
        const isValidDate = date && !isNaN(date.getTime()) && isValid(date);
        
        if (!isValidDate) {
          console.warn('Invalid transaction date:', dateString, 'for transaction:', t.id, 'parsed as:', date);
          return null;
        }
        
        
        return {
          id: t.id, // Keep as string for now since database uses UUIDs
          itemId: t.product_id,
          date,
          quantity: Math.abs(t.quantity), // Use absolute value for calculations
          type: t.transaction_type as 'incoming' | 'outgoing' | 'damaged',
          reference: t.reference || 'Unknown',
          notes: t.notes
        };
      })
      .filter(t => t !== null) as InventoryTransaction[];


    if (realTransactions.length > 0) {
      const oldest = realTransactions.reduce((a, b) => a.date < b.date ? a : b);
      const newest = realTransactions.reduce((a, b) => a.date > b.date ? a : b);
    }

 

    // Use the real prediction utility with actual transaction data
    const predictions = generateInventoryPredictions(inventoryItems, realTransactions, 30, 2);

    
    // If no predictions from utility due to insufficient data, show data collection message
    if (predictions.length === 0 && realTransactions.length === 0) {

      return []; // Return empty - let dashboard show "collecting data" message
    }
    
    // If we have some data but not enough for AI predictions, create basic fallback
    if (predictions.length === 0 && realTransactions.length > 0) {
      const fallbackPredictions = inventoryItems
        .filter(item => item.stock <= 20) // Only show items that might need restocking
        .map(item => {
          // Find recent transactions for this item
          const itemTransactions = realTransactions.filter(t => t.itemId === item.id);
          const recentTransactions = itemTransactions
            .filter(t => t.type === 'outgoing')
            .slice(0, 5); // Last 5 outgoing transactions
          
          let dailyUsage = 0.1; // Default minimal usage
          if (recentTransactions.length > 0) {
            const totalUsage = recentTransactions.reduce((sum, t) => sum + t.quantity, 0);
            dailyUsage = Math.max(0.1, totalUsage / (recentTransactions.length * 3)); // Estimate
          }
          
          const daysUntilRestock = Math.max(1, Math.floor(item.stock / dailyUsage));
          
          return {
            itemId: item.id,
            name: item.name,
            sku: item.sku,
            currentStock: item.stock,
            dailyUsageRate: dailyUsage,
            weeklyUsageRate: dailyUsage * 7,
            daysUntilRestock,
            predictedRestockDate: addDays(new Date(), daysUntilRestock),
            restockUrgency: (item.stock <= 5 ? 'critical' : item.stock <= 10 ? 'warning' : 'normal') as 'critical' | 'warning' | 'normal',
            confidence: recentTransactions.length > 2 ? 60 : 40, // Lower confidence for basic predictions
            suggestedOrderQuantity: Math.max(10, Math.ceil(dailyUsage * 30)) // 30 days supply
          } as PredictionResult;
        });
      
  
      return fallbackPredictions;
    }
    
    return predictions;
  };

  const processShipmentItems = async (items: any[]) => {
    if (!user || !selectedWarehouse) {
      console.error('No user or warehouse selected');
      return;
    }

   

    const createdProducts: string[] = [];
    const updatedProducts: string[] = [];

    try {
      for (const item of items) {
        // Find the product by SKU in the current warehouse
        let product = inventoryItems.find(p => 
          p.sku === item.sku && 
          (p.warehouse_id === selectedWarehouse || !p.warehouse_id)
        );

        // If product doesn't exist, create it
        if (!product) {
   
          
          const companyId = warehouses.find(w => w.warehouse_id === selectedWarehouse)?.company_id || null;
          
          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert({
              sku: item.sku,
              name: item.name || `Product ${item.sku}`,
              quantity: 0, // Start at 0, will be updated below
              stock: 0,
              user_id: user.id,
              warehouse_id: selectedWarehouse,
              company_id: companyId,
              unit_price: 0,
              cost_price: 0,
              low_stock_threshold: 10,
            })
            .select()
            .single();

          if (createError) {
            console.error(`Error creating product ${item.sku}:`, createError);
            throw createError;
          }

 
          product = newProduct as any;
          createdProducts.push(product.name);
        } else {
          updatedProducts.push(product.name);
        }

        // Calculate net quantity to add (received - damaged)
        const receivedQty = item.received_qty || 0;
        const damagedQty = item.damaged_qty || 0;
        const netQuantityToAdd = receivedQty - damagedQty;

        if (netQuantityToAdd <= 0) {
       
          continue;
        }

        // Update the product quantity
        const newQuantity = product.stock + netQuantityToAdd;
        
      

        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Error updating product ${item.sku}:`, updateError);
          continue;
        }

        // Create inventory history record for the incoming shipment
        const { error: historyError } = await supabase
          .from('inventory_history')
          .insert({
            product_id: product.id,
            quantity: netQuantityToAdd,
            transaction_type: 'incoming',
            reference: `Shipment: ${item.shipment_id || 'Unknown'}`,
            user_id: user.id,
            warehouse_id: selectedWarehouse,
            company_id: product.company_id,
            remaining_stock: newQuantity,
            notes: `Shipment received - Expected: ${item.expected_qty}, Received: ${receivedQty}, Damaged: ${damagedQty}${item.notes ? `, Notes: ${item.notes}` : ''}`
          });

        if (historyError) {
          console.error(`Error creating inventory history for ${item.sku}:`, historyError);
        }

        // If there were damaged items, create a separate record for that
        if (damagedQty > 0) {
          const { error: damageHistoryError } = await supabase
            .from('inventory_history')
            .insert({
              product_id: product.id,
              quantity: -damagedQty,
              transaction_type: 'adjustment',
              reference: `Shipment Damage: ${item.shipment_id || 'Unknown'}`,
              user_id: user.id,
              warehouse_id: selectedWarehouse,
              company_id: product.company_id,
              remaining_stock: newQuantity,
              notes: `Damaged items from shipment${item.notes ? ` - ${item.notes}` : ''}`
            });

          if (damageHistoryError) {
            console.error(`Error creating damage history for ${item.sku}:`, damageHistoryError);
          }
        }
      }


      
      // Invalidate inventory queries to update UI
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      return {
        createdProducts,
        updatedProducts,
      };
    } catch (error) {
      console.error('Exception processing shipment items:', error);
      throw error;
    }
  };

  const addInventoryTransaction = (transaction: any) => {
 
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  // Fetch real transactions from database
  const [transactions, setTransactions] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;

      try {
        
        
        // Determine which warehouse to filter by
        const employeeAssignedWarehouse = getEmployeeAssignedWarehouse();
        
        let transactionQuery = supabase
          .from('inventory_history')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filtering logic based on user role
        if (employeeAssignedWarehouse) {
          // Employee assigned to warehouse: show all transactions in their assigned warehouse
  
          transactionQuery = transactionQuery.eq('warehouse_id', employeeAssignedWarehouse);
        } else {
          // Admin/Manager: For predictive analysis, get ALL transactions regardless of warehouse
       
          transactionQuery = transactionQuery.eq('user_id', user.id);
        }

        const { data, error } = await transactionQuery;

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        setTransactions(data || []);
      } catch (error) {
        console.error('Exception fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [user, selectedWarehouse, employees, userRoles]);


  const value = {
    inventoryItems,
    isLoading,
    isAddingProduct,
    refetch,
    addProduct,
    updateProduct,
    deleteProduct,
    generatePredictions,
    processShipmentItems,
    addInventoryTransaction,
    transactions,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
