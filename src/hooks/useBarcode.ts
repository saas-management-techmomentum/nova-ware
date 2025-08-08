
import { useState, useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/types/inventory';
import { ScanMode } from '@/components/barcode/BarcodeScanner';

interface ScanResult {
  success: boolean;
  item?: InventoryItem;
  message: string;
  action?: 'lookup' | 'receive' | 'pick';
}

export const useBarcode = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('lookup');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  
  const { inventoryItems, addInventoryTransaction } = useInventory();
  const { toast } = useToast();

  const findItemByBarcode = useCallback((barcode: string): InventoryItem | null => {
    return inventoryItems.find(item => 
      item.upc === barcode || 
      item.sku === barcode ||
      item.asin === barcode
    ) || null;
  }, [inventoryItems]);

  const handleScan = useCallback((barcode: string, mode: ScanMode) => {
    const item = findItemByBarcode(barcode);
    
    if (!item) {
      const result: ScanResult = {
        success: false,
        message: `No product found with barcode: ${barcode}`
      };
      setLastScanResult(result);
      toast({
        title: "Product Not Found",
        description: result.message,
        variant: "destructive",
      });
      return result;
    }

    let result: ScanResult;

    switch (mode) {
      case 'lookup':
        result = handleLookupScan(item, barcode);
        break;
      case 'receiving':
        result = handleReceivingScan(item, barcode);
        break;
      case 'picking':
        result = handlePickingScan(item, barcode);
        break;
      default:
        result = {
          success: false,
          message: 'Invalid scan mode'
        };
    }

    setLastScanResult(result);
    return result;
  }, [findItemByBarcode, addInventoryTransaction, toast]);

  const handleLookupScan = useCallback((item: InventoryItem, barcode: string): ScanResult => {
    const result: ScanResult = {
      success: true,
      item,
      message: `Found: ${item.name} (Stock: ${item.stock})`,
      action: 'lookup'
    };

    toast({
      title: "Product Found",
      description: `${item.name} - Current stock: ${item.stock} units`,
    });

    return result;
  }, [toast]);

  const handleReceivingScan = useCallback((item: InventoryItem, barcode: string): ScanResult => {
    // In a real implementation, you might want to prompt for quantity
    const defaultQuantity = 1;
    
    addInventoryTransaction({
      itemId: item.id,
      quantity: defaultQuantity,
      type: 'incoming',
      reference: `Barcode Scan: ${barcode}`,
      notes: 'Received via barcode scanning'
    });

    const result: ScanResult = {
      success: true,
      item,
      message: `Received ${defaultQuantity} unit(s) of ${item.name}`,
      action: 'receive'
    };

    toast({
      title: "Item Received",
      description: result.message,
    });

    return result;
  }, [addInventoryTransaction, toast]);

  const handlePickingScan = useCallback((item: InventoryItem, barcode: string): ScanResult => {
    if (item.stock <= 0) {
      const result: ScanResult = {
        success: false,
        item,
        message: `${item.name} is out of stock!`
      };

      toast({
        title: "Out of Stock",
        description: result.message,
        variant: "destructive",
      });

      return result;
    }

    // In a real implementation, this would be tied to specific orders
    const defaultQuantity = 1;
    
    addInventoryTransaction({
      itemId: item.id,
      quantity: defaultQuantity,
      type: 'outgoing',
      reference: `Pick Scan: ${barcode}`,
      notes: 'Picked via barcode scanning'
    });

    const result: ScanResult = {
      success: true,
      item,
      message: `Picked ${defaultQuantity} unit(s) of ${item.name}`,
      action: 'pick'
    };

    toast({
      title: "Item Picked",
      description: result.message,
    });

    return result;
  }, [addInventoryTransaction, toast]);

  const openScanner = useCallback((mode: ScanMode) => {
    setScanMode(mode);
    setIsScanning(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScanning(false);
    setLastScanResult(null);
  }, []);

  return {
    isScanning,
    scanMode,
    lastScanResult,
    handleScan,
    openScanner,
    closeScanner,
    findItemByBarcode
  };
};
