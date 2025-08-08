
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Eye,
  Calendar,
  Building,
  Search,
  Filter,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';
import { useAccountsPayable, VendorBill } from '@/hooks/useAccountsPayable';
import { VendorLedgerDialog } from './VendorLedgerDialog';
import { RecordAPPaymentDialog } from './RecordAPPaymentDialog';
import { AddBillDialog } from './AddBillDialog';

export const AccountsPayable: React.FC = () => {
  const { 
    bills, 
    apSummary, 
    loading, 
    createBill, 
    recordPayment 
  } = useAccountsPayable();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [vendorLedgerOpen, setVendorLedgerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [addBillDialogOpen, setAddBillDialogOpen] = useState(false);

  // Filter bills based on search and filters
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bill.purchase_orders?.po_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || bill.vendor_name === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  // Get unique vendors for filter
  const uniqueVendors = Array.from(new Set(bills.map(bill => bill.vendor_name)));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysToDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'overdue' || daysToDue < 0) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>;
    }
    if (status === 'paid') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>;
    }
    if (status === 'partially_paid') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Partially Paid</Badge>;
    }
    if (daysToDue <= 7) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Due Soon</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Current</Badge>;
  };

  const handleVendorClick = (vendorName: string) => {
    setSelectedVendor(vendorName);
    setVendorLedgerOpen(true);
  };

  const handlePayBill = (bill: VendorBill) => {
    setSelectedBill(bill);
    setPaymentDialogOpen(true);
  };

  const handleBillSelection = (billId: string, checked: boolean) => {
    if (checked) {
      setSelectedBills([...selectedBills, billId]);
    } else {
      setSelectedBills(selectedBills.filter(id => id !== billId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBills(filteredBills.map(bill => bill.id));
    } else {
      setSelectedBills([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading accounts payable data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Accounts Payable</h2>
          <p className="text-slate-400 mt-1">Manage vendor bills and payment schedules</p>
        </div>
        <Button 
          onClick={() => setAddBillDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </div>

      {/* AP Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-medium">Total Payable</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(apSummary?.totalPayable || 0)}
                </p>
              </div>
              <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/20">
                <DollarSign className="h-4 w-4 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-red-400 text-xs font-medium">Overdue</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(apSummary?.overdueAmount || 0)}
                </p>
              </div>
              <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-yellow-400 text-xs font-medium">Due This Week</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(apSummary?.dueThisWeek || 0)}
                </p>
              </div>
              <div className="bg-yellow-500/20 p-2 rounded-xl border border-yellow-500/20">
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-400 text-xs font-medium">Due Next Week</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(apSummary?.dueNextWeek || 0)}
                </p>
              </div>
              <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/20">
                <Calendar className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-green-400 text-xs font-medium">Due in 30 Days</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(apSummary?.dueIn30Days || 0)}
                </p>
              </div>
              <div className="bg-green-500/20 p-2 rounded-xl border border-green-500/20">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="bills" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="bills" className="data-[state=active]:bg-slate-700">
            Vendor Bills
          </TabsTrigger>
          <TabsTrigger value="aging" className="data-[state=active]:bg-slate-700">
            Aging Report
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-slate-700">
            Cash Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bills" className="space-y-6">
          {/* Filters and Search */}
          <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search bills, vendors, or PO numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Filter by vendor" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="all">All Vendors</SelectItem>
                      {uniqueVendors.map(vendor => (
                        <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {selectedBills.length > 0 && (
                    <Button variant="outline" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pay Selected ({selectedBills.length})
                    </Button>
                  )}
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bills Table */}
          <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-400" />
                Vendor Bills ({filteredBills.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Track vendor bills and payment due dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-slate-300">Bill #</TableHead>
                    <TableHead className="text-slate-300">PO #</TableHead>
                    <TableHead className="text-slate-300">Vendor</TableHead>
                    <TableHead className="text-slate-300">Issue Date</TableHead>
                    <TableHead className="text-slate-300">Due Date</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Paid</TableHead>
                    <TableHead className="text-slate-300">Outstanding</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id} className="border-slate-700 hover:bg-slate-800/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedBills.includes(bill.id)}
                          onCheckedChange={(checked) => handleBillSelection(bill.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="text-blue-400 font-medium">{bill.bill_number}</TableCell>
                      <TableCell className="text-green-400 font-medium">
                        {bill.purchase_orders?.po_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleVendorClick(bill.vendor_name)}
                          className="text-white hover:text-blue-400 hover:underline"
                        >
                          {bill.vendor_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(bill.issue_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(bill.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {formatCurrency(bill.amount)}
                      </TableCell>
                      <TableCell className="text-green-400">
                        {formatCurrency(bill.paid_amount)}
                      </TableCell>
                      <TableCell className="text-red-400 font-medium">
                        {formatCurrency(bill.amount - bill.paid_amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(bill.status, bill.due_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bill.status !== 'paid' && (
                            <Button 
                              size="sm" 
                              onClick={() => handlePayBill(bill)}
                              className="bg-green-600 hover:bg-green-700 h-8 px-3"
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredBills.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No bills found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          {/* AP Aging Report */}
          <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                AP Aging Report
              </CardTitle>
              <CardDescription className="text-slate-400">
                Accounts payable breakdown by aging buckets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-green-400 font-medium">Current (0-30 days)</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.aging.current || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-yellow-400 font-medium">31-60 days</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.aging.days_30 || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-orange-400 font-medium">61-90 days</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.aging.days_60 || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-red-400 font-medium">91+ days</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.aging.days_90_plus || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-400 font-medium">Total Outstanding</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.totalPayable || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {/* Cash Outflow Forecast */}
          <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Cash Outflow Forecast
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upcoming payment obligations and cash requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-yellow-400 font-medium">Next 7 Days</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.dueThisWeek || 0)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {bills.filter(bill => {
                        const dueDate = new Date(bill.due_date);
                        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        return dueDate <= nextWeek && bill.status !== 'paid';
                      }).length} bills
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-blue-400 font-medium">Next 14 Days</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency((apSummary?.dueThisWeek || 0) + (apSummary?.dueNextWeek || 0))}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {bills.filter(bill => {
                        const dueDate = new Date(bill.due_date);
                        const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                        return dueDate <= twoWeeks && bill.status !== 'paid';
                      }).length} bills
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="text-sm text-green-400 font-medium">Next 30 Days</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(apSummary?.dueIn30Days || 0)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {bills.filter(bill => {
                        const dueDate = new Date(bill.due_date);
                        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        return dueDate <= thirtyDays && bill.status !== 'paid';
                      }).length} bills
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <VendorLedgerDialog
        vendorName={selectedVendor}
        isOpen={vendorLedgerOpen}
        onClose={() => setVendorLedgerOpen(false)}
      />

      <RecordAPPaymentDialog
        bill={selectedBill}
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onPaymentRecorded={recordPayment}
      />

      <AddBillDialog
        isOpen={addBillDialogOpen}
        onClose={() => setAddBillDialogOpen(false)}
        onBillCreated={createBill}
      />
    </div>
  );
};
