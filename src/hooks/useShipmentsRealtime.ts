
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

    console.log('Setting up real-time subscription for shipments');

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
          console.log('Real-time shipment change detected:', payload);
          
          // For incoming shipments from confirmed POs, always trigger refresh regardless of warehouse filter
          // This ensures new shipments appear immediately
          if (payload.eventType === 'INSERT') {
            console.log('New shipment created, triggering refresh');
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
          console.log('Real-time shipment item change detected:', payload);
          
          // Trigger refresh for shipment items changes too
          onShipmentChange();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, onShipmentChange, warehouseId]);
};
