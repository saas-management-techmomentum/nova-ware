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
import { useVendors } from '@/hooks/useVendors';
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
  
  // View/Edit dialog states
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isViewExpenseOpen, setIsViewExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    vendor: '',
    category: '',
    amount: 0,
    status: '',
    payment_date: '',
    notes: ''
  });

  const { toast } = useToast();
  const { expenses, metrics, isLoading, createExpense, updateExpense, deleteExpense, refetch } = useExpenseManagement();
  const { vendors, isLoading: vendorsLoading } = useVendors();

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

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewExpenseOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setEditForm({
      description: expense.description,
      vendor: expense.vendor || '',
      category: expense.category || '',
      amount: expense.amount,
      status: expense.status,
      payment_date: expense.transaction_date,
      notes: expense.reference || ''
    });
    setIsEditExpenseOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedExpense) return;
    
    await updateExpense(selectedExpense.id, {
      description: editForm.description,
      vendor: editForm.vendor,
      category: editForm.category,
      amount: editForm.amount,
      status: editForm.status,
      transaction_date: editForm.payment_date,
      reference: editForm.notes
    });

    setIsEditExpenseOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = async (expense: any) => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      await deleteExpense(expense.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="ml-2 text-neutral-400">Loading expenses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Expenses</h2>
          <p className="text-neutral-400 mt-1">Real-time expense tracking and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading} className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-neutral-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Expense</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Record a new expense and automatically post it to the general ledger
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="text-neutral-300">Expense Description *</Label>
                    <Input 
                      placeholder="Describe the expense"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Vendor/Payee *</Label>
                    <Select 
                      value={expenseForm.vendor}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, vendor: value }))}
                    >
                      <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-700">
                        {vendors.filter(v => v.is_active).map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.vendor_name}>
                            {vendor.vendor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-neutral-300">Category *</Label>
                    <Select 
                      value={expenseForm.category}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-700">
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
                    <Label className="text-neutral-300">Amount *</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={expenseForm.amount || ''}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-neutral-300">Payment Method</Label>
                    <Select 
                      value={expenseForm.payment_method}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                        <SelectValue placeholder="How was it paid" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-700">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-neutral-300">Payment Date *</Label>
                    <Input 
                      type="date"
                      value={expenseForm.payment_date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_date: e.target.value }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Notes</Label>
                    <Textarea 
                      placeholder="Additional notes..."
                      rows={3}
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)} className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                  Cancel
                </Button>
                <Button onClick={handleExpenseSubmit} className="bg-white text-black hover:bg-neutral-200">
                  Save Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Total Expenses (Month)</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(metrics.totalThisMonth)}
                </p>
                <p className={`text-xs flex items-center ${metrics.lastMonthChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {metrics.lastMonthChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metrics.lastMonthChange >= 0 ? '+' : ''}{metrics.lastMonthChange.toFixed(1)}% vs last month
                </p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/20">
                <Receipt className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Top Category</p>
                <p className="text-lg font-bold text-white">
                  {metrics.topCategories[0]?.name || 'No expenses'}
                </p>
                <p className="text-sm text-neutral-400">
                  {metrics.topCategories[0] ? formatCurrency(metrics.topCategories[0].amount) : 'N/A'}
                </p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/20">
                {metrics.topCategories[0] ? getCategoryIcon(metrics.topCategories[0].name) : <Building className="h-5 w-5 text-orange-400" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Top Vendor</p>
                <p className="text-lg font-bold text-white truncate">
                  {metrics.topVendor?.name || 'No vendors'}
                </p>
                <p className="text-sm text-neutral-400">
                  {metrics.topVendor ? formatCurrency(metrics.topVendor.amount) : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-700/20 p-3 rounded-xl border border-gray-600/20">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Unpaid Expenses</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(metrics.totalUnpaid)}
                </p>
                <p className="text-xs text-neutral-400">Pending payments</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-xl border border-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="bg-neutral-900/50 border-neutral-800">
          <TabsTrigger value="expenses" className="data-[state=active]:bg-neutral-800">All Expenses</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-neutral-800">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Filters */}
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
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
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-white">Expense Records</CardTitle>
              <CardDescription className="text-neutral-400">
                All expense transactions from your general ledger
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-neutral-400">No expenses found</p>
                  <p className="text-sm text-neutral-500">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Add your first expense to get started'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800">
                      <TableHead className="text-neutral-300">Date</TableHead>
                      <TableHead className="text-neutral-300">Description</TableHead>
                      <TableHead className="text-neutral-300">Vendor</TableHead>
                      <TableHead className="text-neutral-300">Category</TableHead>
                      <TableHead className="text-neutral-300">Amount</TableHead>
                      <TableHead className="text-neutral-300">Status</TableHead>
                      <TableHead className="text-neutral-300">Warehouse</TableHead>
                      <TableHead className="text-neutral-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="border-neutral-800 hover:bg-neutral-800/30">
                        <TableCell className="text-neutral-400">
                          {expense.transaction_date 
                            ? new Date(expense.transaction_date).toLocaleDateString() 
                            : 'No date'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{expense.description}</p>
                            {expense.reference && (
                              <p className="text-xs text-neutral-500">{expense.reference}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-300">{expense.vendor || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-neutral-300">
                            {getCategoryIcon(expense.category)}
                            <span className="text-sm">{expense.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-white">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell className="text-neutral-400">
                          {expense.warehouse_name || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewExpense(expense)} className="hover:bg-neutral-800">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)} className="hover:bg-neutral-800">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense)} className="hover:bg-neutral-800">
                              <Trash2 className="h-4 w-4 text-red-400" />
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
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-white">Expense Categories Breakdown</CardTitle>
              <CardDescription className="text-neutral-400">
                Spending analysis by category from real transaction data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.topCategories.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-neutral-400">No category data available</p>
                  <p className="text-sm text-neutral-500">
                    Category breakdown will appear here once you have expense records
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.topCategories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-lg border border-neutral-800/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-neutral-700/50 rounded-full">
                          {getCategoryIcon(category.name)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{category.name}</p>
                          <p className="text-sm text-neutral-400">{category.percentage.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(category.amount)}</p>
                        <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-neutral-500 rounded-full transition-all duration-300"
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

      {/* View Expense Dialog */}
      <Dialog open={isViewExpenseOpen} onOpenChange={setIsViewExpenseOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-400">Description</Label>
                  <p className="font-medium text-white">{selectedExpense.description}</p>
                </div>
                <div>
                  <Label className="text-neutral-400">Amount</Label>
                  <p className="font-medium text-white">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div>
                  <Label className="text-neutral-400">Vendor</Label>
                  <p className="font-medium text-white">{selectedExpense.vendor || '-'}</p>
                </div>
                <div>
                  <Label className="text-neutral-400">Category</Label>
                  <p className="font-medium text-white">{selectedExpense.category || '-'}</p>
                </div>
                <div>
                  <Label className="text-neutral-400">Date</Label>
                  <p className="font-medium text-white">{new Date(selectedExpense.transaction_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-neutral-400">Status</Label>
                  {getStatusBadge(selectedExpense.status)}
                </div>
                {selectedExpense.reference && (
                  <div className="col-span-2">
                    <Label className="text-neutral-400">Notes</Label>
                    <p className="font-medium text-white">{selectedExpense.reference}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Expense</DialogTitle>
            <DialogDescription className="text-neutral-400">Update expense details and payment status</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label className="text-neutral-300">Description</Label>
                <Input 
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Vendor</Label>
                <Select 
                  value={editForm.vendor}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, vendor: value }))}
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    {vendors.filter(v => v.is_active).map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.vendor_name}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-neutral-300">Category</Label>
                <Select 
                  value={editForm.category}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
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
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-neutral-300">Amount</Label>
                <Input 
                  type="number"
                  value={editForm.amount || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Payment Status</Label>
                <Select 
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-neutral-300">Date</Label>
                <Input 
                  type="date"
                  value={editForm.payment_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Notes</Label>
                <Textarea 
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)} className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-white text-black hover:bg-neutral-200">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
