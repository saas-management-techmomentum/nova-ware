
/**
 * Utility functions for warehouse metric calculations
 */

interface WarehouseData {
  ordersProcessedOnTime: number;
  totalOrders: number;
  accurateInventoryItems: number;
  totalInventoryItems: number;
  spaceUtilized: number;
  totalSpace: number;
  actualOutput: number;
  plannedOutput: number;
}

/**
 * Calculate warehouse efficiency based on multiple operational factors
 * @param data Warehouse operational data
 * @returns Efficiency percentage (0-100)
 */
export const calculateWarehouseEfficiency = (data: WarehouseData): number => {
  // Order fulfillment rate (weight: 30%)
  const orderFulfillmentRate = data.ordersProcessedOnTime / data.totalOrders;
  
  // Inventory accuracy (weight: 25%)
  const inventoryAccuracy = data.accurateInventoryItems / data.totalInventoryItems;
  
  // Space utilization (weight: 20%)
  const spaceUtilization = data.spaceUtilized / data.totalSpace;
  
  // Operational productivity (weight: 25%)
  const productivity = data.actualOutput / data.plannedOutput;
  
  // Weighted calculation
  const efficiency = (
    (orderFulfillmentRate * 0.3) +
    (inventoryAccuracy * 0.25) +
    (spaceUtilization * 0.2) +
    (productivity * 0.25)
  ) * 100;
  
  // Round to 1 decimal place
  return Math.round(efficiency * 10) / 10;
};

/**
 * Get sample warehouse data for demonstration
 * @returns Sample warehouse data
 */
export const getSampleWarehouseData = (): WarehouseData => {
  // Get current date for more realistic data that changes slightly each time
  const today = new Date();
  const dayVariance = (today.getDate() % 5) / 100; // Small variance based on day of month
  
  return {
    ordersProcessedOnTime: 127 + Math.floor(Math.random() * 5),
    totalOrders: 134 + Math.floor(Math.random() * 3),
    accurateInventoryItems: 4621 + Math.floor(Math.random() * 10),
    totalInventoryItems: 4650,
    spaceUtilized: 14500 + Math.floor(Math.random() * 100),
    totalSpace: 16000,
    actualOutput: 923 + Math.floor(Math.random() * 8),
    plannedOutput: 950
  };
};

/**
 * Generate a formatted efficiency string with percentage
 */
export const getFormattedEfficiency = (efficiency: number): string => {
  return `${efficiency.toFixed(1)}%`;
};

/**
 * Get the appropriate CSS color class based on the efficiency value
 */
export const getEfficiencyColorClass = (efficiency: number): string => {
  if (efficiency >= 95) return 'text-emerald-400';
  if (efficiency >= 85) return 'text-indigo-400';
  if (efficiency >= 75) return 'text-amber-400';
  return 'text-rose-400';
};

/**
 * Convert timestamp to relative time string (e.g. "2 minutes ago")
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};
