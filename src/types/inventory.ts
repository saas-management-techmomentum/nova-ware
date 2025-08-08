
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  quantity?: number; // Keep for database compatibility
  unit_price: number;
  cost_price?: number; // Buy price per unit
  case_price?: number;
  case_cost?: number; // Buy price per case
  category?: string;
  description?: string;
  image_url?: string;
  upc?: string;
  asin?: string;
  casesize?: string;
  dimensions?: string;
  weight?: string;
  expiration?: Date | null;
  low_stock_threshold?: number; // Custom threshold for low stock alerts
  location?: string;
  // Batch tracking properties
  has_batches?: boolean;
  batches?: ProductBatch[];
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  expiration_date?: Date | null;
  quantity: number;
  cost_price: number;
  received_date: Date;
  supplier_reference?: string;
  notes?: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  location_id?: string;
  location_name?: string; // For display purposes
  created_at: Date;
  updated_at: Date;
}

export interface InventoryTransaction {
  id: string; // Changed to string to match database UUIDs
  itemId: string;
  date: Date;
  quantity: number;
  type: 'incoming' | 'outgoing' | 'damaged';
  reference: string;
  unitPrice?: number;
  notes?: string;
}

export type PredictionResult = {
  itemId: string;
  name: string;
  sku: string;
  currentStock: number;
  dailyUsageRate: number;
  weeklyUsageRate: number;
  daysUntilRestock: number;
  predictedRestockDate: Date;
  restockUrgency: 'critical' | 'warning' | 'normal';
  confidence: number;
  suggestedOrderQuantity: number;
};
