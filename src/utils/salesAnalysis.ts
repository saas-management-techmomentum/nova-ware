
import { InventoryItem, InventoryTransaction } from '@/types/inventory';

export interface ProductSalesData {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  currentStock: number;
}

export const calculateProductSales = (
  inventoryItems: InventoryItem[],
  transactions: InventoryTransaction[]
): { bestSellers: ProductSalesData[]; worstSellers: ProductSalesData[] } => {

  
  // Calculate total sales for each product
  const salesMap = new Map<string, number>();
  
  // Count outgoing transactions (sales) - ensure we're only counting actual sales
  const outgoingTransactions = transactions.filter(t => t.type === 'outgoing');

  outgoingTransactions.forEach(transaction => {
    const currentSales = salesMap.get(transaction.itemId) || 0;
    salesMap.set(transaction.itemId, currentSales + transaction.quantity);
  });
  
  // Create product sales data array - ensure we include all inventory items
  const productSalesData: ProductSalesData[] = inventoryItems.map(item => {
    const totalSold = salesMap.get(item.id) || 0;
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      totalSold,
      currentStock: item.stock || 0  // Ensure we handle null/undefined stock
    };
  });
  
  
  // Sort by total sold (descending for best sellers)
  const bestSellers = [...productSalesData]
    .filter(item => item.totalSold > 0) // Only items with actual sales
    .sort((a, b) => b.totalSold - a.totalSold);
  
  // For worst sellers, prioritize items with stock but low or no sales
  const worstSellers = [...productSalesData]
    .filter(item => item.currentStock > 0) // Only items currently in stock
    .sort((a, b) => {
      // First sort by total sold (ascending), then by stock level (descending)
      if (a.totalSold !== b.totalSold) {
        return a.totalSold - b.totalSold;
      }
      return b.currentStock - a.currentStock;
    });
  
  
  return {
    bestSellers,
    worstSellers
  };
};
