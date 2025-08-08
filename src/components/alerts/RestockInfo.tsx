
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TruckIcon, AlertTriangle } from 'lucide-react';

interface RestockInfoProps {
  restockQuantity: number;
  restockDate: string;
  daysUntilRestock: number | null;
  formatDate: (dateString: string) => string;
}

const RestockInfo = ({ restockQuantity, restockDate, daysUntilRestock, formatDate }: RestockInfoProps) => {
  if (restockQuantity > 0) {
    return (
      <div className="flex items-center">
        <TruckIcon className="h-4 w-4 mr-2 text-indigo-400" />
        <div>
          <div className="font-medium text-white">
            {formatDate(restockDate)}
          </div>
          <div className="flex gap-2 items-center text-sm text-slate-400">
            <span>{restockQuantity} units arriving</span>
            {daysUntilRestock !== null && (
              <Badge 
                variant="outline" 
                className="border-purple-500/30 bg-purple-500/20 text-purple-300 text-xs"
              >
                {daysUntilRestock} days
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-amber-400 flex items-center">
      <AlertTriangle className="h-4 w-4 mr-2" />
      <span>No restock scheduled</span>
    </div>
  );
};

export default RestockInfo;
