
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package } from 'lucide-react';
import LowStockBadge from './LowStockBadge';
import RestockInfo from './RestockInfo';

interface LowStockItem {
  id: string;
  name: string;
  upc: string;
  currentStock: number;
  minThreshold: number;
  restockDate: string;
  restockQuantity: number;
}

interface LowStockTableProps {
  items: LowStockItem[];
  formatDate: (dateString: string) => string;
  getDaysUntilRestock: (dateString: string) => number | null;
}

const LowStockTable = ({ items, formatDate, getDaysUntilRestock }: LowStockTableProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Package className="h-12 w-12 text-slate-600 opacity-30 mb-2" />
        <h3 className="text-lg font-medium text-white">No low stock items found</h3>
        <p className="text-sm text-slate-400">
          Try adjusting your search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader className="bg-slate-800/90">
          <TableRow className="border-slate-700">
            <TableHead className="font-medium text-slate-300">Product</TableHead>
            <TableHead className="font-medium text-slate-300">Current Stock</TableHead>
            <TableHead className="font-medium text-slate-300">Restock Information</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
              <TableCell>
                <div>
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-sm text-slate-400">{item.upc}</div>
                </div>
              </TableCell>
              <TableCell>
                <LowStockBadge stock={item.currentStock} />
              </TableCell>
              <TableCell>
                <RestockInfo 
                  restockQuantity={item.restockQuantity} 
                  restockDate={item.restockDate} 
                  daysUntilRestock={getDaysUntilRestock(item.restockDate)} 
                  formatDate={formatDate}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LowStockTable;
