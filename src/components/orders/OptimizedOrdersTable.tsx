import React, { useState, useMemo, useCallback } from 'react';
import { useOrdersQuery, useOrderDetailsQuery } from '@/hooks/queries/useOrdersQuery';
import { VirtualTable } from '@/components/ui/virtual-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface OptimizedOrdersTableProps {
  className?: string;
}

export const OptimizedOrdersTable: React.FC<OptimizedOrdersTableProps> = ({ className }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data, isLoading, error } = useOrdersQuery({ 
    page, 
    limit: 50, 
    search: search || undefined,
    status: statusFilter || undefined
  });

  const { data: orderDetails } = useOrderDetailsQuery(expandedOrder || '');

  const getStatusBadge = useCallback((status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-green-100 text-green-800',
      'delivered': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  }, []);

  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedOrder(current => current === orderId ? null : orderId);
  }, []);

  const columns = useMemo(() => [
    {
      id: 'expand',
      header: '',
      width: 50,
      cell: (row: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleOrderExpansion(row.id)}
          className="p-1"
        >
          {expandedOrder === row.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )
    },
    {
      id: 'id',
      header: 'Order ID',
      accessorKey: 'id' as const,
      width: 150
    },
    {
      id: 'customer',
      header: 'Customer',
      accessorKey: 'customer_name' as const,
      width: 200
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      cell: (row: any) => getStatusBadge(row.status)
    },
    {
      id: 'created_at',
      header: 'Order Date',
      width: 150,
      cell: (row: any) => format(new Date(row.created_at), 'MMM d, yyyy')
    },
    {
      id: 'ship_date',
      header: 'Ship Date',
      width: 150,
      cell: (row: any) => row.ship_date ? format(new Date(row.ship_date), 'MMM d, yyyy') : '-'
    },
    {
      id: 'tracking',
      header: 'Tracking',
      accessorKey: 'tracking_number' as const,
      width: 150
    }
  ], [expandedOrder, getStatusBadge, toggleOrderExpansion]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
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
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            Error loading orders: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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

        {expandedOrder && orderDetails && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Order Details</h4>
            <div className="space-y-2">
              <div>
                <strong>Items:</strong>
                <ul className="ml-4 mt-1">
                  {orderDetails.items.map((item) => (
                    <li key={item.id} className="text-sm">
                      {item.sku} - Quantity: {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Documents:</strong>
                {orderDetails.documents.length > 0 ? (
                  <ul className="ml-4 mt-1">
                    {orderDetails.documents.map((doc) => (
                      <li key={doc.id} className="text-sm">
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {doc.file_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-muted-foreground ml-4">No documents</span>
                )}
              </div>
            </div>
          </div>
        )}

        {data?.hasMore && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setPage(p => p + 1)}
              variant="outline"
              disabled={isLoading}
            >
              Load More Orders
            </Button>
          </div>
        )}

        <div className="mt-2 text-sm text-muted-foreground text-center">
          Showing {data?.data.length || 0} of {data?.count || 0} orders
        </div>
      </CardContent>
    </Card>
  );
};