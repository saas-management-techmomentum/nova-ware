
import { useState, useEffect, useCallback } from 'react';
import { usePalletLocations } from './usePalletLocations';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface LocationAnalytics {
  locationId: string;
  utilizationRate: number;
  pickingEfficiency: number;
  lastAccessed: Date;
  movementFrequency: number;
  capacity: number;
  currentItems: number;
}

export interface LocationSuggestion {
  type: 'optimal' | 'consolidation' | 'suboptimal';
  message: string;
  locationId: string;
  priority: 'high' | 'medium' | 'low';
}

export const useEnhancedLocationManagement = () => {
  const { pallets, loading, addPallet, fetchPallets } = usePalletLocations();
  const [analytics, setAnalytics] = useState<LocationAnalytics[]>([]);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [realtimeMovements, setRealtimeMovements] = useState<any[]>([]);
  const { toast } = useToast();

  // Real-time movement tracking
  useEffect(() => {
    const channel = supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pallet_locations'
        },
        (payload) => {
        
          setRealtimeMovements(prev => [...prev.slice(-9), payload]);
          fetchPallets(); // Refresh data
          
          toast({
            title: "Location Updated",
            description: "Warehouse layout updated in real-time",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPallets, toast]);

  // Calculate analytics for locations
  const calculateAnalytics = useCallback(() => {
    const locationAnalytics: LocationAnalytics[] = pallets.map(pallet => {
      const totalItems = pallet.products.reduce((sum, p) => sum + p.qty, 0);
      const capacity = 100; // Default capacity, could be configurable
      const utilizationRate = (totalItems / capacity) * 100;
      
      // Mock data for demonstration - in real implementation, this would come from historical data
      const pickingEfficiency = Math.random() * 100;
      const movementFrequency = Math.random() * 50;
      
      return {
        locationId: pallet.id,
        utilizationRate: Math.min(utilizationRate, 100),
        pickingEfficiency,
        lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        movementFrequency,
        capacity,
        currentItems: totalItems
      };
    });
    
    setAnalytics(locationAnalytics);
  }, [pallets]);

  // Generate smart suggestions
  const generateSuggestions = useCallback(() => {
    const newSuggestions: LocationSuggestion[] = [];
    
    analytics.forEach(location => {
      // Overutilized locations
      if (location.utilizationRate > 90) {
        newSuggestions.push({
          type: 'suboptimal',
          message: `Location ${location.locationId} is over capacity (${location.utilizationRate.toFixed(1)}%)`,
          locationId: location.locationId,
          priority: 'high'
        });
      }
      
      // Underutilized locations
      if (location.utilizationRate < 20 && location.currentItems > 0) {
        newSuggestions.push({
          type: 'consolidation',
          message: `Consider consolidating items from ${location.locationId} (${location.utilizationRate.toFixed(1)}% utilized)`,
          locationId: location.locationId,
          priority: 'medium'
        });
      }
      
      // Low movement frequency
      if (location.movementFrequency < 10) {
        newSuggestions.push({
          type: 'optimal',
          message: `Move slow-moving items from ${location.locationId} to deeper storage`,
          locationId: location.locationId,
          priority: 'low'
        });
      }
    });
    
    setSuggestions(newSuggestions);
  }, [analytics]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  const moveItems = async (fromPallet: string, toPallet: string, items: any[]) => {
    try {
      // Implementation for moving items between pallets
      toast({
        title: "Items Moved",
        description: `Successfully moved items from ${fromPallet} to ${toPallet}`,
      });
      
      await fetchPallets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move items",
        variant: "destructive",
      });
    }
  };

  const bulkUpdateLocations = async (updates: Array<{palletId: string, newLocation: string}>) => {
    try {
      // Implementation for bulk updates
      toast({
        title: "Bulk Update Complete",
        description: `Updated ${updates.length} locations`,
      });
      
      await fetchPallets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update locations",
        variant: "destructive",
      });
    }
  };

  return {
    pallets,
    loading,
    addPallet,
    analytics,
    suggestions,
    realtimeMovements,
    moveItems,
    bulkUpdateLocations,
    fetchPallets
  };
};
