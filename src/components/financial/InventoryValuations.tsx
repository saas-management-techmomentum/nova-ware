import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useInventoryValuations } from '@/hooks/useInventoryValuations';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  AlertTriangle,
  Settings,
  BarChart3,
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  History,
  Calculator,
  RefreshCw,
  Loader2
} from 'lucide-react';

export const InventoryValuations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [valuationMethod, setValuationMethod] = useState('FIFO');
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    product_id: '',
    quantity: 0,
    adjustment_type: 'damage' as 'damage' | 'shrinkage' | 'writeoff' | 'correction',
    reason: ''
  });

  const { toast } = useToast();
  const {
    valuations,
    cogsEntries,
    adjustments,
    metrics,
    isLoading,
    createInventoryAdjustment,
    refetch
  } = useInventoryValuations();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getValuationMethodBadge = (method: string) => {
    switch (method) {
      case 'FIFO':
        return <Badge variant="outline" className="border-primary/50 text-primary">FIFO</Badge>;
      case 'LIFO':
        return <Badge variant="outline" className="border-orange-500/50 text-orange-400">LIFO</Badge>;
      case 'Weighted Average':
        return <Badge variant="outline" className="border-purple-500/50 text-purple-400">Weighted Avg</Badge>;
      default:
        return <Badge variant="outline">FIFO</Badge>;
    }
  };

  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case 'damage':
        return <Badge variant="destructive">Damage</Badge>;
      case 'shrinkage':
        return <Badge variant="secondary">Shrinkage</Badge>;
      case 'writeoff':
        return <Badge variant="outline" className="border-red-500 text-red-500">Write-off</Badge>;
      case 'correction':
        return <Badge variant="default">Correction</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCogsTypeBadge = (type: string) => {
    switch (type) {
      case 'Sale':
        return <Badge variant="default">Sale</Badge>;
      case 'Adjustment':
        return <Badge variant="secondary">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredInventory = valuations.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(valuations.map(item => item.category).filter(Boolean)));

  const handleAdjustmentSubmit = async () => {
    if (!adjustmentForm.product_id || adjustmentForm.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a product and enter a valid quantity.",
        variant: "destructive"
      });
      return;
    }

    const result = await createInventoryAdjustment(adjustmentForm);
    
    if (result.success) {
      toast({
        title: "Adjustment Created",
        description: "Inventory adjustment has been recorded successfully.",
      });
      setIsAdjustmentDialogOpen(false);
      setAdjustmentForm({
        product_id: '',
        quantity: 0,
        adjustment_type: 'damage',
        reason: ''
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create adjustment.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading inventory valuations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Valuation & COGS</h2>
          <p className="text-muted-foreground mt-1">Real-time inventory value tracking and cost of goods sold</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Inventory Adjustment</DialogTitle>
                <DialogDescription>
                  Record inventory adjustments for damages, shrinkage, or corrections
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adjustment-type">Adjustment Type</Label>
                  <Select 
                    value={adjustmentForm.adjustment_type}
                    onValueChange={(value: any) => setAdjustmentForm(prev => ({ ...prev, adjustment_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="shrinkage">Shrinkage</SelectItem>
                      <SelectItem value="writeoff">Write-off</SelectItem>
                      <SelectItem value="correction">Manual Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select 
                    value={adjustmentForm.product_id}
                    onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, product_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {valuations.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.sku} - {item.name} (Qty: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity Adjusted</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={adjustmentForm.quantity || ''}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason/Notes</Label>
                  <Textarea 
                    placeholder="Describe the reason for adjustment..."
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdjustmentSubmit}>
                    Record Adjustment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.totalInventoryValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {valuations.length} products tracked
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">COGS This Month</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.cogsThisMonth)}
                </p>
                <p className="text-xs text-orange-600">
                  {metrics.adjustmentsMade} adjustments made
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-xl">
                <Calculator className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Gross Margin</p>
                <p className="text-2xl font-bold">
                  {metrics.grossMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Based on real sales data
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-xl">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Top Products by Value</p>
              <div className="space-y-1">
                {metrics.topProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate">{product.name}</span>
                    <span className="font-medium">{formatCurrency(product.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="valuations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="valuations">Current Valuations</TabsTrigger>
          <TabsTrigger value="cogs">COGS Tracking</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="valuations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={valuationMethod} onValueChange={setValuationMethod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="LIFO">LIFO</SelectItem>
                    <SelectItem value="Weighted Average">Weighted Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Valuation Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Valuations</CardTitle>
              <CardDescription>
                Real-time inventory values from your warehouse system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No inventory items found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Add products to your inventory to see valuations'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Valuation Method</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-primary">{item.sku}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.category && (
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.quantity}</span>
                            {item.quantity <= item.low_stock_threshold && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.cost_price)}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.total_value)}</TableCell>
                        <TableCell>{getValuationMethodBadge(valuationMethod)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.last_updated).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cogs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>COGS Tracking</CardTitle>
              <CardDescription>
                Real-time cost of goods sold from sales and inventory transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cogsEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No COGS entries found</p>
                  <p className="text-sm text-muted-foreground">
                    COGS entries will appear here when products are sold or adjusted
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total COGS</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cogsEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{getCogsTypeBadge(entry.type)}</TableCell>
                        <TableCell>{entry.product_name}</TableCell>
                        <TableCell className="text-primary">{entry.sku}</TableCell>
                        <TableCell>{entry.quantity}</TableCell>
                        <TableCell>{formatCurrency(entry.unit_cost)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(entry.total_cogs)}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Adjustments</CardTitle>
              <CardDescription>
                History of all inventory adjustments and their impact on valuations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adjustments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No adjustments recorded</p>
                  <p className="text-sm text-muted-foreground">
                    Inventory adjustments will appear here when recorded
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Value Impact</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>
                          {new Date(adjustment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getAdjustmentTypeBadge(adjustment.adjustment_type)}</TableCell>
                        <TableCell>{adjustment.quantity}</TableCell>
                        <TableCell className="font-medium text-destructive">
                          -{formatCurrency(adjustment.total_value)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                        <TableCell className="text-muted-foreground">{adjustment.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};