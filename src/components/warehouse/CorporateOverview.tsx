
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, Activity } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';

const CorporateOverview: React.FC = () => {
  const { warehouses } = useWarehouse();

  return (
    <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center text-white gap-2">
          <Building2 className="h-4 w-4 text-indigo-400" />
          Corporate Overview
          <span className="ml-auto text-xs font-normal text-emerald-400 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {warehouses.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        <div className="space-y-2">
          {warehouses.slice(0, 3).map((warehouse) => (
            <div
              key={warehouse.warehouse_id}
              className="p-2 bg-slate-700/50 rounded-md border border-slate-600/50 hover:bg-slate-700/70 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="font-medium text-white text-xs">{warehouse.warehouse_code}</span>
                </div>
                <span className="text-xs text-slate-400 capitalize">{warehouse.user_role}</span>
              </div>
              <p className="text-xs text-slate-300 mb-1 truncate">{warehouse.warehouse_name}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-2.5 w-2.5" />
                <span>Active</span>
              </div>
            </div>
          ))}
          {warehouses.length > 3 && (
            <div className="text-center py-1">
              <span className="text-xs text-slate-400">+{warehouses.length - 3} more warehouses</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CorporateOverview;
