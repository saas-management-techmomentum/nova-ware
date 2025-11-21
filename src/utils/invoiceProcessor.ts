
import * as XLSX from 'xlsx';
import { InventoryItem } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';

export type ProcessedInvoiceItem = {
  // Core identification
  upc: string;
  sku: string;
  name?: string;
  asin?: string;
  
  // Inventory
  quantity: number;
  category?: string;
  description?: string;
  
  // Pricing
  unit_price?: number;
  cost_price?: number;
  case_price?: number;
  case_cost?: number;
  
  // Physical attributes
  casesize?: string;
  dimensions?: string;
  weight?: string;
  
  // Additional
  image_url?: string;
  expiration?: string;
  has_batches?: boolean;
  
  // Processing state
  found: boolean;
  productId?: string;
};

export const processInvoiceFile = (file: File): Promise<ProcessedInvoiceItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const processedItems: ProcessedInvoiceItem[] = json.map((row: any) => {
          // Helper function to safely parse numbers
          const parseNumber = (value: any): number | undefined => {
            if (value === null || value === undefined || value === '') return undefined;
            const parsed = parseFloat(value.toString());
            return isNaN(parsed) ? undefined : parsed;
          };

          // Helper function to safely parse booleans
          const parseBoolean = (value: any): boolean | undefined => {
            if (value === null || value === undefined || value === '') return undefined;
            const str = value.toString().toLowerCase();
            if (str === 'true' || str === '1' || str === 'yes') return true;
            if (str === 'false' || str === '0' || str === 'no') return false;
            return undefined;
          };

          // Helper function to safely convert to string
          const parseString = (value: any): string => {
            return value?.toString() || '';
          };

          return {
            // Core identification
            upc: parseString(row.UPC || row.upc),
            sku: parseString(row.SKU || row.sku),
            name: parseString(row.Name || row.name),
            asin: parseString(row.ASIN || row.asin),
            
            // Inventory
            quantity: parseNumber(row.Quantity || row.quantity) || 0,
            category: parseString(row.Category || row.category),
            description: parseString(row.Description || row.description),
            
            // Pricing
            unit_price: parseNumber(row.Unit_Price || row['Unit Price'] || row.unit_price),
            cost_price: parseNumber(row.Cost_Price || row['Cost Price'] || row.cost_price),
            case_price: parseNumber(row.Case_Price || row['Case Price'] || row.case_price),
            case_cost: parseNumber(row.Case_Cost || row['Case Cost'] || row.case_cost),
            
            // Physical attributes
            casesize: parseString(row.Case_Size || row['Case Size'] || row.casesize),
            dimensions: parseString(row.Dimensions || row.dimensions),
            weight: parseString(row.Weight || row.weight),
            
            // Additional
            image_url: parseString(row.Image_URL || row['Image URL'] || row.image_url),
            expiration: parseString(row.Expiration || row.expiration),
            has_batches: parseBoolean(row.Has_Batches || row['Has Batches'] || row.has_batches),
            
            // Processing state
            found: false
          };
        });
        
        resolve(processedItems);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

export const processInvoiceWithAI = async (file: File): Promise<ProcessedInvoiceItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result as string;
        const base64 = base64Data.split(',')[1]; // Remove data:image/... prefix
        
        const fileType = file.type.split('/')[1] || 'jpeg';
        
        console.log('Calling AI processing function...');
        
        const { data, error } = await supabase.functions.invoke('process-invoice-ai', {
          body: {
            imageBase64: base64,
            fileType: fileType
          }
        });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        if (!data.success) {
          throw new Error(data.error || 'AI processing failed');
        }
        
        console.log('AI extracted data:', data.extractedData);
        
        const processedItems: ProcessedInvoiceItem[] = data.extractedData.items.map((item: any) => ({
          upc: item.upc || '',
          sku: item.sku || '',
          quantity: item.quantity || 0,
          name: item.name || '',
          found: false
        }));
        
        resolve(processedItems);
      } catch (error) {
        console.error('Error processing invoice with AI:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const matchProductsWithInventory = (
  items: ProcessedInvoiceItem[],
  inventoryItems: InventoryItem[]
): ProcessedInvoiceItem[] => {
  return items.map(item => {
    const matchedProduct = inventoryItems.find(
      invItem => 
        (item.upc && invItem.upc === item.upc) || 
        (item.sku && invItem.sku === item.sku) ||
        (item.name && invItem.name.toLowerCase().includes(item.name.toLowerCase()))
    );
    
    if (matchedProduct) {
      return {
        ...item,
        found: true,
        name: matchedProduct.name,
        productId: matchedProduct.id.toString()
      };
    }
    
    return item;
  });
};
