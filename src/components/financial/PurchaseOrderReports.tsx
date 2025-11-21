import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { format } from 'date-fns';

interface PurchaseOrderReportsProps {
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseOrderReports: React.FC<PurchaseOrderReportsProps> = ({ purchaseOrders }) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedVendor, setSelectedVendor] = useState<string>('all');

  // Get unique vendors
  const vendors = Array.from(new Set(purchaseOrders.map(po => po.vendor_name)));

  // Filter POs based on filters
  const filteredPOs = purchaseOrders.filter(po => {
    const poDate = new Date(po.order_date);
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
    
    const dateMatch = (!startDate || poDate >= startDate) && (!endDate || poDate <= endDate);
    const vendorMatch = selectedVendor === 'all' || po.vendor_name === selectedVendor;
    
    return dateMatch && vendorMatch;
  });

  // Calculate spend analysis by vendor
  const vendorSpendAnalysis = vendors.map(vendor => {
    const vendorPOs = filteredPOs.filter(po => po.vendor_name === vendor);
    const totalSpend = vendorPOs.reduce((sum, po) => sum + po.total_amount, 0);
    const orderCount = vendorPOs.length;
    const avgOrderValue = orderCount > 0 ? totalSpend / orderCount : 0;
    
    return {
      vendor,
      totalSpend,
      orderCount,
      avgOrderValue,
      status: {
        completed: vendorPOs.filter(po => po.status === 'received').length,
        pending: vendorPOs.filter(po => ['draft', 'approved'].includes(po.status)).length,
        late: vendorPOs.filter(po => 
          po.expected_delivery_date && 
          new Date(po.expected_delivery_date) < new Date() && 
          po.status !== 'received'
        ).length
      }
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend);

  // Get pending deliveries
  const pendingDeliveries = filteredPOs.filter(po => 
    ['approved', 'partially_received'].includes(po.status)
  ).map(po => ({
    ...po,
    isLate: po.expected_delivery_date && new Date(po.expected_delivery_date) < new Date(),
    daysUntilDue: po.expected_delivery_date 
      ? Math.ceil((new Date(po.expected_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null
  })).sort((a, b) => {
    if (a.expected_delivery_date && b.expected_delivery_date) {
      return new Date(a.expected_delivery_date).getTime() - new Date(b.expected_delivery_date).getTime();
    }
    return 0;
  });

  // PO vs Bill reconciliation (simplified - would need actual AP data)
  const reconciliationData = filteredPOs
    .filter(po => po.status === 'received')
    .map(po => ({
      ...po,
      billAmount: po.total_amount, // In real implementation, this would come from AP
      variance: 0, // Would calculate actual variance
      reconciled: true // Would check if bill exists and matches
    }));

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setSelectedVendor('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="spend-analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spend-analysis">Spend Analysis</TabsTrigger>
          <TabsTrigger value="pending-deliveries">Pending Deliveries</TabsTrigger>
          <TabsTrigger value="po-history">PO History</TabsTrigger>
          <TabsTrigger value="reconciliation">PO vs Bill Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="spend-analysis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Vendor Spend Analysis
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(vendorSpendAnalysis, 'vendor-spend-analysis')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Order Count</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Late</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorSpendAnalysis.map((vendor) => (
                    <TableRow key={vendor.vendor}>
                      <TableCell className="font-medium">{vendor.vendor}</TableCell>
                      <TableCell>${vendor.totalSpend.toLocaleString()}</TableCell>
                      <TableCell>{vendor.orderCount}</TableCell>
                      <TableCell>${vendor.avgOrderValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="default">{vendor.status.completed}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{vendor.status.pending}</Badge>
                      </TableCell>
                      <TableCell>
                        {vendor.status.late > 0 ? (
                          <Badge variant="destructive">{vendor.status.late}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-deliveries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pending Deliveries
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(pendingDeliveries, 'pending-deliveries')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Days Until Due</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDeliveries.map((po) => (
                    <TableRow key={po.id} className={po.isLate ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.vendor_name}</TableCell>
                      <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {po.expected_delivery_date 
                            ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                            : '-'
                          }
                          {po.isLate && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {po.daysUntilDue !== null ? (
                          <Badge variant={po.daysUntilDue < 0 ? "destructive" : po.daysUntilDue <= 3 ? "default" : "secondary"}>
                            {po.daysUntilDue < 0 ? `${Math.abs(po.daysUntilDue)} days late` : `${po.daysUntilDue} days`}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'approved' ? "default" : "outline"}>
                          {po.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po-history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Order History</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(filteredPOs, 'po-history')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.vendor_name}</TableCell>
                      <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {po.expected_delivery_date 
                          ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          po.status === 'received' ? "default" :
                          po.status === 'approved' ? "secondary" :
                          "outline"
                        }>
                          {po.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>PO vs Bill Reconciliation</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>PO Amount</TableHead>
                    <TableHead>Bill Amount</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationData.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.vendor_name}</TableCell>
                      <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>${po.billAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={po.variance === 0 ? "default" : "destructive"}>
                          ${Math.abs(po.variance).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={po.reconciled ? "default" : "destructive"}>
                          {po.reconciled ? "Reconciled" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};