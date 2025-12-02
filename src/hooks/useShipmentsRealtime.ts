
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseShipmentsRealtimeProps {
  onShipmentChange: () => void;
  warehouseId?: string;
}

export const useShipmentsRealtime = ({ onShipmentChange, warehouseId }: UseShipmentsRealtimeProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;


    const channel = supabase
      .channel('shipments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
      
          
          // For incoming shipments from confirmed POs, always trigger refresh regardless of warehouse filter
          // This ensures new shipments appear immediately
          if (payload.eventType === 'INSERT') {
  
            onShipmentChange();
            return;
          }
          
          // For updates/deletes, apply warehouse filtering
          if (warehouseId && payload.new && (payload.new as any).warehouse_id !== warehouseId) {
            return;
          }
          
          // Trigger refresh
          onShipmentChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipment_items',
        },
        (payload) => {
    
          
          // Trigger refresh for shipment items changes too
          onShipmentChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onShipmentChange, warehouseId]);
};
