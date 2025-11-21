
import React from 'react';

// Helper function to extract base SKU from warehouse-specific SKU
export const getBaseSku = (warehouseSku: string): string => {
  // Remove warehouse suffix if it exists (e.g., "SKU-123-WH1" -> "SKU-123")
  return warehouseSku.replace(/-WH[^-]*$/, '');
};

// Helper function to create warehouse-specific SKU
export const createWarehouseSku = (baseSku: string, warehouseId: string): string => {
  const warehouseCode = warehouseId.slice(0, 8); // Use first 8 chars of warehouse ID
  return `${baseSku}-WH${warehouseCode}`;
};

// Component to display SKU with base SKU emphasis
interface SKUDisplayProps {
  sku: string;
  showWarehouseCode?: boolean;
}

export const SKUDisplay: React.FC<SKUDisplayProps> = ({ sku, showWarehouseCode = true }) => {
  const baseSku = getBaseSku(sku);
  const isWarehouseSpecific = sku !== baseSku;
  
  if (!isWarehouseSpecific || !showWarehouseCode) {
    return <span className="font-mono text-sm">{baseSku}</span>;
  }
  
  const warehouseCode = sku.replace(baseSku + '-', '');
  
  return (
    <span className="font-mono text-sm">
      <span className="font-semibold">{baseSku}</span>
      <span className="text-slate-500 ml-1">({warehouseCode})</span>
    </span>
  );
};
