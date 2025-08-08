
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useShipmentStatusSync = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to shipment status changes
    const subscription = supabase
      .channel('shipment-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: 'shipment_type=eq.incoming'
        },
        (payload) => {
          const { new: newShipment, old: oldShipment } = payload;
          
          // Check if status changed to 'received'
          if (newShipment.status === 'received' && oldShipment.status !== 'received') {
            // Show notification about PO status update
            if (newShipment.source_po_id) {
              toast({
                title: "Purchase Order Updated",
                description: `PO status has been updated to 'received' based on shipment completion`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);
};
