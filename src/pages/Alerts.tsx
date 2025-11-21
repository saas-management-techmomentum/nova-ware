
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Package } from 'lucide-react';
import { useLowStockItems } from '@/hooks/useLowStockItems';
import LowStockTable from '@/components/alerts/LowStockTable';
import SearchFilter from '@/components/alerts/SearchFilter';

const Alerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const { lowStockItems } = useLowStockItems();

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysUntilRestock = (dateString: string) => {
    if (!dateString) return null;
    const today = new Date();
    const restockDate = new Date(dateString);
    const diffTime = restockDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Apply sorting and filtering
  const sortedItems = [...lowStockItems].sort((a, b) => {
    if (sortOrder === 'stock') {
      return a.currentStock - b.currentStock;
    } else {
      // If restockDate is empty, sort to the bottom
      if (!a.restockDate) return 1;
      if (!b.restockDate) return -1;
      return new Date(a.restockDate).getTime() - new Date(b.restockDate).getTime();
    }
  });

  const filteredItems = sortedItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.upc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'stock' ? 'date' : 'stock');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 text-rose-400" />
          Low Stock Alerts
        </h1>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-700">
          <CardTitle className="text-lg flex items-center text-white">
            <Package className="h-5 w-5 mr-2 text-rose-400" />
            Low Stock Management
          </CardTitle>
          <CardDescription className="text-slate-400">
            View items with low inventory and upcoming restock dates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SearchFilter 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            sortOrder={sortOrder} 
            toggleSortOrder={toggleSortOrder} 
          />
          
          <LowStockTable 
            items={filteredItems} 
            formatDate={formatDate} 
            getDaysUntilRestock={getDaysUntilRestock} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
