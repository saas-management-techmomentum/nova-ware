import React, { useState, useMemo, useCallback } from 'react';
import { useInventoryQuery } from '@/hooks/queries/useInventoryQuery';
import { VirtualTable } from '@/components/ui/virtual-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, AlertTriangle, Package } from 'lucide-react';

interface OptimizedInventoryTableProps {
  className?: string;
}

export const OptimizedInventoryTable: React.FC<OptimizedInventoryTableProps> = ({ className }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const { data, isLoading, error } = useInventoryQuery({ 
    page, 
    limit: 50, 
    search: search || undefined,
    lowStock: lowStockFilter || undefined
  });

  const getStockStatus = useCallback((quantity: number) => {
    if (quantity <= 0) {
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else if (quantity <= 20) {
      return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  }, []);

  const columns = useMemo(() => [
    {
      id: 'sku',
      header: 'SKU',
      accessorKey: 'sku' as const,
      width: 120
    },
    {
      id: 'name',
      header: 'Product Name',
      accessorKey: 'name' as const,
      width: 250
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category' as const,
      width: 150
    },
    {
      id: 'quantity',
      header: 'Stock',
      width: 100,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.quantity <= 5 && <AlertTriangle className="h-4 w-4 text-red-500" />}
          <span className={row.quantity <= 5 ? 'text-red-600 font-semibold' : ''}>
            {row.quantity}
          </span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      cell: (row: any) => getStockStatus(row.quantity)
    },
    {
      id: 'unit_price',
      header: 'Unit Price',
      width: 120,
      cell: (row: any) => row.unit_price ? `$${Number(row.unit_price).toFixed(2)}` : '-'
    },
    {
      id: 'cost_price',
      header: 'Cost',
      width: 120,
      cell: (row: any) => row.cost_price ? `$${Number(row.cost_price).toFixed(2)}` : '-'
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location' as const,
      width: 150
    }
  ], [getStockStatus]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            Error loading inventory: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory
        </CardTitle>
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={lowStockFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Low Stock
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <VirtualTable
          data={data?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          height={500}
          className="w-full"
        />

        {data?.hasMore && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setPage(p => p + 1)}
              variant="outline"
              disabled={isLoading}
            >
              Load More Products
            </Button>
          </div>
        )}

        <div className="mt-2 text-sm text-muted-foreground text-center">
          Showing {data?.data.length || 0} of {data?.count || 0} products
        </div>
      </CardContent>
    </Card>
  );
};