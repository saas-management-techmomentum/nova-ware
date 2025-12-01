
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Globe, Activity, Shield } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import AddWarehouseDialog from '@/components/warehouse/AddWarehouseDialog';

const WarehouseSelector: React.FC = () => {
  const { warehouses, selectedWarehouse, setSelectedWarehouse, canViewAllWarehouses, refreshWarehouses, isUserAdmin } = useWarehouse();
  const { warehouseAssignments } = useUserPermissions();
  
  const handleWarehouseChange = (warehouseId: string | null) => {
    setSelectedWarehouse(warehouseId);
  };

  const getCurrentSelectionText = () => {
    if (!selectedWarehouse) {
      return isUserAdmin ? 'Corporate Overview' : 'All Locations';
    }
    const warehouse = warehouses.find(w => w.warehouse_id === selectedWarehouse);
    return warehouse ? `${warehouse.warehouse_code}` : 'Select Warehouse';
  };

  const getSelectionIcon = () => {
    if (!selectedWarehouse) {
      return isUserAdmin ? <Globe className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
    }
    return <Building2 className="h-4 w-4" />;
  };

  const handleWarehouseAdded = async () => {
    await refreshWarehouses();
  };

  // Show the dropdown if user is admin or has multiple warehouse access
  const shouldShowDropdown = isUserAdmin || warehouses.length > 1;

  if (!shouldShowDropdown) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
          {getSelectionIcon()}
          <span className="text-sm font-medium">{getCurrentSelectionText()}</span>
          {isUserAdmin && !selectedWarehouse && (
            <Shield className="h-3 w-3 text-neutral-400" />
          )}
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 text-neutral-300 z-50"
      >
        {isUserAdmin && (
          <>
            <DropdownMenuItem 
              onClick={() => handleWarehouseChange(null)}
              className="flex items-center gap-2 hover:bg-neutral-700/50 focus:bg-neutral-700/50"
            >
              <Globe className="h-4 w-4 text-neutral-400" />
              <div className="flex flex-col">
                <span className="font-medium">Corporate Overview</span>
                <span className="text-xs text-neutral-400">All warehouses & data</span>
              </div>
              {!selectedWarehouse && <Activity className="h-3 w-3 ml-auto text-emerald-400" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-700/50" />
          </>
        )}
        
        {!isUserAdmin && warehouses.length > 1 && (
          <>
            <DropdownMenuItem 
              onClick={() => handleWarehouseChange(null)}
              className="flex items-center gap-2 hover:bg-neutral-700/50 focus:bg-neutral-700/50"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-medium">All Locations</span>
                <span className="text-xs text-neutral-400">Combined view</span>
              </div>
              {!selectedWarehouse && <Activity className="h-3 w-3 ml-auto text-emerald-400" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-700/50" />
          </>
        )}
        
        {warehouses.map((warehouse) => {
          const assignment = warehouseAssignments.find(w => w.warehouse_id === warehouse.warehouse_id);
          return (
            <DropdownMenuItem 
              key={warehouse.warehouse_id}
              onClick={() => handleWarehouseChange(warehouse.warehouse_id)}
              className="flex items-center gap-2 hover:bg-neutral-700/50 focus:bg-neutral-700/50"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{warehouse.warehouse_code}</span>
                  {assignment?.role === 'manager' && (
                    <Shield className="h-3 w-3 text-amber-400" />
                  )}
                </div>
                <span className="text-xs text-neutral-400">{warehouse.warehouse_name}</span>
              </div>
              {selectedWarehouse === warehouse.warehouse_id && (
                <Activity className="h-3 w-3 ml-auto text-emerald-400" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        {isUserAdmin && (
          <>
            <DropdownMenuSeparator className="bg-neutral-700/50" />
            <div className="p-2">
              <AddWarehouseDialog onWarehouseAdded={handleWarehouseAdded} />
            </div>
          </>
        )}
        
        {warehouses.length === 0 && (
          <DropdownMenuItem disabled className="text-neutral-500 text-xs">
            No warehouses assigned
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WarehouseSelector;
