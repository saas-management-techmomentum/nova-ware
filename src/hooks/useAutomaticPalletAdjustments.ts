// COMMENTED OUT: cleanup_empty_pallets RPC function missing from database
// This feature requires database schema updates before it can be enabled

/*
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface OrderFulfillmentLog {
  id: string;
  orderId: string;
  affectedPallets: {
    palletId: string;
    oldQuantity: number;
    newQuantity: number;
    productSku: string;
  }[];
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
}

export const useAutomaticPalletAdjustments = () => {
  const { user } = useAuth();
  const [fulfillmentLogs, setFulfillmentLogs] = useState<OrderFulfillmentLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Listen for real-time updates to pallet products
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pallet-adjustments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pallet_products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Pallet quantity updated:', payload);
          toast({
            title: "Pallet Updated",
            description: `Pallet quantities automatically adjusted for order fulfillment`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.notes?.includes('Automatic pallet adjustment')) {
            console.log('Automatic inventory adjustment logged:', payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const cleanupEmptyPallets = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      // Call the cleanup function
      const { error } = await supabase.rpc('cleanup_empty_pallets');
      
      if (error) throw error;

      toast({
        title: "Cleanup Complete",
        description: "Empty pallets have been removed from the system",
      });
    } catch (error) {
      console.error('Error cleaning up empty pallets:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup empty pallets",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    fulfillmentLogs,
    isProcessing,
    cleanupEmptyPallets,
  };
};
*/

export interface OrderFulfillmentLog {
  id: string;
  orderId: string;
  affectedPallets: {
    palletId: string;
    oldQuantity: number;
    newQuantity: number;
    productSku: string;
  }[];
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
}

// Stub export to maintain compatibility
export const useAutomaticPalletAdjustments = () => ({
  fulfillmentLogs: [] as OrderFulfillmentLog[],
  isProcessing: false,
  cleanupEmptyPallets: async () => {}
});
