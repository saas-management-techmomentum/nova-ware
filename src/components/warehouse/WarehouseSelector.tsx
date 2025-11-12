
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';

const WarehouseSelector: React.FC = () => {
  const { warehouses, selectedWarehouse, setSelectedWarehouse, canViewAllWarehouses } = useWarehouse();

  if (warehouses.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedWarehouse || 'all'}
        onValueChange={(value) => {
          if (value === 'all') {
            setSelectedWarehouse(null);
          } else {
            setSelectedWarehouse(value);
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>
        <SelectContent>
          {canViewAllWarehouses && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>All Locations</span>
              </div>
            </SelectItem>
          )}
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
              {warehouse.warehouse_code} - {warehouse.warehouse_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default WarehouseSelector;
