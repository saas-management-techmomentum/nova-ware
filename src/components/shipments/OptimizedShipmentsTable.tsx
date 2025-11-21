import React, { useState, useMemo, useCallback } from 'react';
import { useShipmentsQuery } from '@/hooks/queries/useShipmentsQuery';
import { VirtualTable } from '@/components/ui/virtual-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Truck, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface OptimizedShipmentsTableProps {
  className?: string;
}

export const OptimizedShipmentsTable: React.FC<OptimizedShipmentsTableProps> = ({ className }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const { data, isLoading, error } = useShipmentsQuery({ 
    page, 
    limit: 50, 
    search: search || undefined,
    status: statusFilter || undefined
  });

  const getStatusBadge = useCallback((status: string) => {
    const statusColors: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Transit': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Delayed': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  }, []);

  const toggleShipmentExpansion = useCallback((shipmentId: string) => {
    setExpandedShipment(current => current === shipmentId ? null : shipmentId);
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
          onClick={() => toggleShipmentExpansion(row.id)}
          className="p-1"
        >
          {expandedShipment === row.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )
    },
    {
      id: 'id',
      header: 'Shipment ID',
      accessorKey: 'id' as const,
      width: 150
    },
    {
      id: 'supplier',
      header: 'Supplier/Customer',
      accessorKey: 'supplier' as const,
      width: 200
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      cell: (row: any) => getStatusBadge(row.status)
    },
    {
      id: 'expected_date',
      header: 'Expected Date',
      width: 150,
      cell: (row: any) => row.expected_date ? format(new Date(row.expected_date), 'MMM d, yyyy') : '-'
    },
    {
      id: 'tracking_number',
      header: 'Tracking #',
      accessorKey: 'tracking_number' as const,
      width: 150
    },
    {
      id: 'created_at',
      header: 'Created',
      width: 150,
      cell: (row: any) => format(new Date(row.created_at), 'MMM d, yyyy')
    }
  ], [expandedShipment, getStatusBadge, toggleShipmentExpansion]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipments
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
            <Truck className="h-5 w-5" />
            Shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            Error loading shipments: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipments
        </CardTitle>
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search shipments..."
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

        {data?.hasMore && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setPage(p => p + 1)}
              variant="outline"
              disabled={isLoading}
            >
              Load More Shipments
            </Button>
          </div>
        )}

        <div className="mt-2 text-sm text-muted-foreground text-center">
          Showing {data?.data.length || 0} of {data?.count || 0} shipments
        </div>
      </CardContent>
    </Card>
  );
};