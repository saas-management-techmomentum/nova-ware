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
import { useExpenseManagement } from '@/hooks/useExpenseManagement';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Calendar,
  Building,
  Zap,
  Car,
  Search,
  Filter,
  DollarSign,
  Clock,
  Repeat,
  BarChart3,
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const ExpenseManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    vendor: '',
    category: '',
    amount: 0,
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const { toast } = useToast();
  const { expenses, metrics, isLoading, createExpense, refetch } = useExpenseManagement();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'Rent & Facilities': Building,
      'Utilities': Zap,
      'Transportation': Car,
      'Equipment & Maintenance': Receipt,
      'Office Supplies': FileText,
      'Software & Technology': FileText,
      'Insurance': Receipt,
      'Marketing & Advertising': BarChart3,
      'Other Expenses': Receipt
    };
    const IconComponent = iconMap[category] || Receipt;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.vendor && expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(expenses.map(exp => exp.category)));

  const handleExpenseSubmit = async () => {
    if (!expenseForm.description || !expenseForm.vendor || !expenseForm.category || expenseForm.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive"
      });
      return;
    }

    const result = await createExpense(expenseForm);
    
    if (result.success) {
      toast({
        title: "Expense Created",
        description: "Expense has been recorded and posted to the general ledger.",
      });
      setIsAddExpenseOpen(false);
      setExpenseForm({
        description: '',
        vendor: '',
        category: '',
        amount: 0,
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create expense.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading expenses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expenses</h2>
          <p className="text-muted-foreground mt-1">Real-time expense tracking and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense and automatically post it to the general ledger
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Expense Description *</Label>
                    <Input 
                      placeholder="Describe the expense"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Vendor/Payee *</Label>
                    <Input 
                      placeholder="Who was paid"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, vendor: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select 
                      value={expenseForm.category}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rent & Facilities">Rent & Facilities</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Equipment & Maintenance">Equipment & Maintenance</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Software & Technology">Software & Technology</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
                        <SelectItem value="Other Expenses">Other Expenses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount *</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={expenseForm.amount || ''}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select 
                      value={expenseForm.payment_method}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How was it paid" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Date *</Label>
                    <Input 
                      type="date"
                      value={expenseForm.payment_date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea 
                      placeholder="Additional notes..."
                      rows={3}
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExpenseSubmit}>
                  Save Expense
                </Button>
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
                <p className="text-sm font-medium text-muted-foreground">Total Expenses (Month)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.totalThisMonth)}
                </p>
                <p className={`text-xs flex items-center ${metrics.lastMonthChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.lastMonthChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metrics.lastMonthChange >= 0 ? '+' : ''}{metrics.lastMonthChange.toFixed(1)}% vs last month
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                <p className="text-lg font-bold">
                  {metrics.topCategories[0]?.name || 'No expenses'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {metrics.topCategories[0] ? formatCurrency(metrics.topCategories[0].amount) : 'N/A'}
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-xl">
                {metrics.topCategories[0] ? getCategoryIcon(metrics.topCategories[0].name) : <Building className="h-5 w-5 text-orange-500" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Top Vendor</p>
                <p className="text-lg font-bold truncate">
                  {metrics.topVendor?.name || 'No vendors'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {metrics.topVendor ? formatCurrency(metrics.topVendor.amount) : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-700/10 p-3 rounded-xl">
                <DollarSign className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Unpaid Expenses</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.totalUnpaid)}
                </p>
                <p className="text-xs text-muted-foreground">Pending payments</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search expenses..."
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>
                All expense transactions from your general ledger
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No expenses found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Add your first expense to get started'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(expense.entry_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            {expense.reference && (
                              <p className="text-xs text-muted-foreground">{expense.reference}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{expense.vendor || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(expense.category)}
                            <span className="text-sm">{expense.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {expense.warehouse_name || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories Breakdown</CardTitle>
              <CardDescription>
                Spending analysis by category from real transaction data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.topCategories.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No category data available</p>
                  <p className="text-sm text-muted-foreground">
                    Category breakdown will appear here once you have expense records
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.topCategories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          {getCategoryIcon(category.name)}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(category.amount)}</p>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};