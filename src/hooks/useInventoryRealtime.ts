
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useInventoryRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

 

    const channel = supabase
      .channel('inventory-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          
          
          // Invalidate inventory queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          
          // Show toast notification
          toast({
            title: "Product Added",
            description: `${payload.new.name} has been added to inventory`,
            duration: 3000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          
          
          // Invalidate inventory queries
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          
          // Show notification for significant changes
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          if (oldRecord.quantity !== newRecord.quantity) {
            toast({
              title: "Inventory Updated",
              description: `${newRecord.name}: ${oldRecord.quantity} → ${newRecord.quantity} units`,
              duration: 3000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
        
          
          // Invalidate inventory queries
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          
          toast({
            title: "Product Removed",
            description: `${payload.old.name} has been removed from inventory`,
            duration: 3000,
          });
        }
      )

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  return null; // This hook doesn't return anything, it just sets up subscriptions
};
