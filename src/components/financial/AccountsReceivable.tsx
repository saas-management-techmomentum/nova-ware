
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Send,
  Eye,
  Calendar,
  Search,
  Filter,
  FileText,
  Download,
  Mail,
  CreditCard,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useEnhancedFinancialData } from '@/hooks/useEnhancedFinancialData';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { CustomerLedgerDialog } from './CustomerLedgerDialog';

export const AccountsReceivable: React.FC = () => {
  const { 
    arInvoices, 
    arSummary, 
    isLoading, 
    filter, 
    setFilter, 
    recordPayment, 
    sendPaymentReminder,
    refreshData 
  } = useAccountsReceivable();
  
  const { metrics: enhancedMetrics } = useEnhancedFinancialData();

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [customerLedgerOpen, setCustomerLedgerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string, daysPastDue: number) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>;
    }
    if (daysPastDue === 0) {
      return <Badge className="bg-gray-700/20 text-gray-400 border-gray-600/30">Current</Badge>;
    }
    if (daysPastDue <= 30) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{daysPastDue} days overdue</Badge>;
    }
    if (daysPastDue <= 60) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{daysPastDue} days overdue</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{daysPastDue} days overdue</Badge>;
  };

  const handleWidgetClick = (filterType: string) => {
    setFilter(prev => ({
      ...prev,
      status: filterType === 'overdue' ? 'overdue' : 'all',
      overdue: filterType === 'overdue'
    }));
  };

  const handleRecordPayment = (invoice: any) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  };

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerLedgerOpen(true);
  };

  const handleBulkReminders = () => {
    selectedInvoices.forEach(invoiceId => {
      sendPaymentReminder(invoiceId);
    });
    setSelectedInvoices([]);
  };

  const filteredInvoices = arInvoices.filter(invoice => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return invoice.invoice_number.toLowerCase().includes(search) ||
             invoice.client_name.toLowerCase().includes(search);
    }
    return true;
  });

  const upcomingDueInvoices = arInvoices
    .filter(inv => inv.days_past_due === 0 && (inv.total_amount - inv.paid_amount) > 0)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Accounts Receivable</h2>
          <p className="text-neutral-400 mt-1">Track outstanding payments and customer receivables</p>
        </div>
        <div className="flex gap-3">
          {selectedInvoices.length > 0 && (
            <Button onClick={handleBulkReminders} className="bg-orange-600 hover:bg-orange-700">
              <Send className="h-4 w-4 mr-2" />
              Send Bulk Reminders ({selectedInvoices.length})
            </Button>
          )}
          <Button onClick={() => refreshData()} variant="outline" className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* AR Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 cursor-pointer hover:bg-neutral-800/60 transition-colors"
          onClick={() => handleWidgetClick('total')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-neutral-400 text-sm font-medium">Total Outstanding</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(enhancedMetrics.accountsReceivable || arSummary.total_outstanding)}
                </p>
              </div>
              <div className="bg-gray-700/20 p-3 rounded-xl border border-gray-600/20">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 cursor-pointer hover:bg-neutral-800/60 transition-colors"
          onClick={() => handleWidgetClick('current')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-400 text-sm font-medium">Current AR</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(enhancedMetrics.currentAR || arSummary.current_ar)}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 cursor-pointer hover:bg-neutral-800/60 transition-colors"
          onClick={() => handleWidgetClick('overdue')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-yellow-400 text-sm font-medium">Past Due</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(enhancedMetrics.overdueAR || arSummary.past_due)}
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-xl border border-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 cursor-pointer hover:bg-neutral-800/60 transition-colors"
          onClick={() => handleWidgetClick('overdue')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-red-400 text-sm font-medium">90+ Days</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(arSummary.overdue_90_plus)}
                </p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-neutral-900/50">
          <TabsTrigger value="invoices" className="text-sm">Invoice Management</TabsTrigger>
          <TabsTrigger value="aging" className="text-sm">Aging Report</TabsTrigger>
          <TabsTrigger value="forecast" className="text-sm">Collection Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    Outstanding Invoices
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Manage payment collections and customer receivables
                  </CardDescription>
                </div>
              </div>
              
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search invoices or customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                
                <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40 bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant={filter.overdue ? "default" : "outline"}
                  onClick={() => setFilter(prev => ({ ...prev, overdue: !prev.overdue }))}
                  className={filter.overdue ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800"}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Overdue Only
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800">
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                          } else {
                            setSelectedInvoices([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-neutral-300">Invoice #</TableHead>
                    <TableHead className="text-neutral-300">Customer</TableHead>
                    <TableHead className="text-neutral-300">Issue Date</TableHead>
                    <TableHead className="text-neutral-300">Due Date</TableHead>
                    <TableHead className="text-neutral-300">Amount</TableHead>
                    <TableHead className="text-neutral-300">Paid</TableHead>
                    <TableHead className="text-neutral-300">Status</TableHead>
                    <TableHead className="text-neutral-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-neutral-400 py-8">
                        Loading invoices...
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-neutral-400 py-8">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-neutral-800 hover:bg-neutral-800/30">
                        <TableCell>
                          <Checkbox 
                            checked={selectedInvoices.includes(invoice.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedInvoices(prev => [...prev, invoice.id]);
                              } else {
                                setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-gray-400 font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell 
                          className="text-white cursor-pointer hover:text-gray-400"
                          onClick={() => handleCustomerClick({
                            id: invoice.client_id,
                            name: invoice.client_name,
                            contact_email: invoice.client_contact_email
                          })}
                        >
                          {invoice.client_name}
                        </TableCell>
                        <TableCell className="text-neutral-300">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-neutral-300">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell className="text-green-400">
                          {formatCurrency(invoice.paid_amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status, invoice.days_past_due)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 bg-neutral-900 border-neutral-700 hover:bg-neutral-800"
                              onClick={() => sendPaymentReminder(invoice.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 bg-neutral-900 border-neutral-700 hover:bg-neutral-800"
                              onClick={() => handleRecordPayment(invoice)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" />
                AR Aging Report
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Breakdown of receivables by aging periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800/30">
                  <div className="text-sm text-gray-400 font-medium">Current (0-30)</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {formatCurrency(arSummary.current_ar)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {arSummary.total_outstanding > 0 ? 
                      Math.round((arSummary.current_ar / arSummary.total_outstanding) * 100) : 0}% of total
                  </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
                  <div className="text-sm text-yellow-400 font-medium">1-30 Days</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {formatCurrency(arSummary.overdue_30)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {arSummary.total_outstanding > 0 ? 
                      Math.round((arSummary.overdue_30 / arSummary.total_outstanding) * 100) : 0}% of total
                  </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
                  <div className="text-sm text-orange-400 font-medium">31-60 Days</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {formatCurrency(arSummary.overdue_60)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {arSummary.total_outstanding > 0 ? 
                      Math.round((arSummary.overdue_60 / arSummary.total_outstanding) * 100) : 0}% of total
                  </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
                  <div className="text-sm text-red-400 font-medium">90+ Days</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {formatCurrency(arSummary.overdue_90_plus)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {arSummary.total_outstanding > 0 ? 
                      Math.round((arSummary.overdue_90_plus / arSummary.total_outstanding) * 100) : 0}% of total
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button className="bg-gray-800 hover:bg-gray-900">
                  <Download className="h-4 w-4 mr-2" />
                  Export Aging Report
                </Button>
                <Button variant="outline" className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Collection Forecast
              </CardTitle>
              <CardDescription className="text-slate-400">
                Expected cash inflows based on due dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
                    <div className="text-sm text-green-400 font-medium">Next 7 Days</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {formatCurrency(
                        arInvoices
                          .filter(inv => {
                            const dueDate = new Date(inv.due_date);
                            const now = new Date();
                            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                            return diffDays >= 0 && diffDays <= 7 && (inv.total_amount - inv.paid_amount) > 0;
                          })
                          .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
                    <div className="text-sm text-gray-400 font-medium">Next 30 Days</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {formatCurrency(
                        arInvoices
                          .filter(inv => {
                            const dueDate = new Date(inv.due_date);
                            const now = new Date();
                            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                            return diffDays >= 0 && diffDays <= 30 && (inv.total_amount - inv.paid_amount) > 0;
                          })
                          .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
                    <div className="text-sm text-purple-400 font-medium">Next 90 Days</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {formatCurrency(
                        arInvoices
                          .filter(inv => {
                            const dueDate = new Date(inv.due_date);
                            const now = new Date();
                            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                            return diffDays >= 0 && diffDays <= 90 && (inv.total_amount - inv.paid_amount) > 0;
                          })
                          .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0)
                      )}
                    </div>
                  </div>
                </div>

                {upcomingDueInvoices.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Upcoming Due Invoices</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Invoice #</TableHead>
                          <TableHead className="text-slate-300">Customer</TableHead>
                          <TableHead className="text-slate-300">Due Date</TableHead>
                          <TableHead className="text-slate-300">Amount</TableHead>
                          <TableHead className="text-slate-300">Days Until Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingDueInvoices.map((invoice) => {
                          const daysUntilDue = Math.ceil(
                            (new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
                          );
                          return (
                            <TableRow key={invoice.id} className="border-slate-700">
                              <TableCell className="text-gray-400">{invoice.invoice_number}</TableCell>
                              <TableCell className="text-white">{invoice.client_name}</TableCell>
                              <TableCell className="text-slate-300">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-white">
                                {formatCurrency(invoice.total_amount - invoice.paid_amount)}
                              </TableCell>
                              <TableCell className="text-slate-300">{daysUntilDue} days</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={selectedInvoiceForPayment}
          onRecordPayment={(paymentData) => {
            if (!selectedInvoiceForPayment) return;
            return recordPayment(selectedInvoiceForPayment.id, paymentData);
          }}
      />

      <CustomerLedgerDialog
        open={customerLedgerOpen}
        onOpenChange={setCustomerLedgerOpen}
        customer={selectedCustomer}
      />
    </div>
  );
};
