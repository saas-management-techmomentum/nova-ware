import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  Filter,
  Building,
  Warehouse,
  Calendar,
  ChevronDown,
  FileText,
  Search
} from 'lucide-react';
import { useGeneralLedger } from '@/hooks/useGeneralLedger';
import { useAccountsData } from '@/hooks/useAccountsData';
import { formatCurrency } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useWarehouse } from '@/contexts/WarehouseContext';

export const GeneralLedger = () => {
  const { journalEntries, isLoading, selectedWarehouse, isInCorporateOverview } = useGeneralLedger();
  const { accounts } = useAccountsData();
  const { warehouses } = useWarehouse();
  
  // Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [accountFilter, setAccountFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Transform journal entries into ledger entries
  const ledgerEntries = useMemo(() => {
    const entries: any[] = [];
    
    journalEntries.forEach((entry) => {
      if (entry.journal_entry_lines) {
        entry.journal_entry_lines.forEach((line: any) => {
          const account = line.accounts;
          entries.push({
            id: `${entry.id}-${line.id}`,
            date: entry.entry_date,
            transactionId: entry.entry_number,
            reference: entry.reference || '',
            description: line.description || entry.description,
            account: account?.account_name || 'Unknown Account',
            accountCode: account?.account_code || '',
            accountType: '', // Will determine from account code
            debitAmount: line.debit_amount || 0,
            creditAmount: line.credit_amount || 0,
            warehouse: entry.warehouses?.name || 'Unassigned',
            warehouseId: entry.warehouse_id,
            status: entry.status,
            module: entry.module || 'manual',
            referenceId: entry.reference_id,
          });
        });
      }
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journalEntries, accounts]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(entry => {
      // Date range filter
      if (dateFrom) {
        const entryDate = new Date(entry.date);
        if (entryDate < dateFrom) return false;
      }
      if (dateTo) {
        const entryDate = new Date(entry.date);
        if (entryDate > dateTo) return false;
      }

      // Account filter
      if (accountFilter !== 'all') {
        if (accountFilter === 'assets' && !entry.accountCode.startsWith('1')) return false;
        if (accountFilter === 'liabilities' && !entry.accountCode.startsWith('2')) return false;
        if (accountFilter === 'equity' && !entry.accountCode.startsWith('3')) return false;
        if (accountFilter === 'revenue' && !entry.accountCode.startsWith('4')) return false;
        if (accountFilter === 'expenses' && !entry.accountCode.startsWith('5')) return false;
      }

      // Warehouse filter
      if (warehouseFilter !== 'all' && entry.warehouseId !== warehouseFilter) return false;

      // Module filter
      if (moduleFilter !== 'all' && entry.module !== moduleFilter) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          entry.transactionId.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.reference.toLowerCase().includes(searchLower) ||
          entry.account.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [ledgerEntries, dateFrom, dateTo, accountFilter, warehouseFilter, moduleFilter, searchTerm]);

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Transaction ID',
      'Reference', 
      'Description',
      'Account',
      'Account Code',
      'Debit Amount',
      'Credit Amount',
      'Module',
      'Warehouse'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.date,
        entry.transactionId,
        `"${entry.reference}"`,
        `"${entry.description}"`,
        `"${entry.account}"`,
        entry.accountCode,
        entry.debitAmount,
        entry.creditAmount,
        `"${entry.module}"`,
        `"${entry.warehouse}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">General Ledger</h2>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-slate-600 rounded w-full"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Corporate Overview Banner */}
      {isInCorporateOverview && (
        <Card className="bg-gray-800/20 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Corporate Overview</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">General ledger across all warehouses</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">General Ledger</h2>
          <p className="text-slate-400 mt-1">
            Complete transaction history and audit trail
            {isInCorporateOverview && " across all warehouses"}
          </p>
        </div>
        <Button onClick={exportToCSV} className="bg-gray-800 hover:bg-gray-900">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-700/50 border-slate-600"
              />
            </div>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-slate-700/50 border-slate-600"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>From date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-slate-700/50 border-slate-600"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>To date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Account Type Filter */}
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="assets">Assets (1xxx)</SelectItem>
                <SelectItem value="liabilities">Liabilities (2xxx)</SelectItem>
                <SelectItem value="equity">Equity (3xxx)</SelectItem>
                <SelectItem value="revenue">Revenue (4xxx)</SelectItem>
                <SelectItem value="expenses">Expenses (5xxx)</SelectItem>
              </SelectContent>
            </Select>

            {/* Module Filter */}
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="purchase_order">Purchase Order</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
                <SelectItem value="bank_transaction">Bank Transaction</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
              </SelectContent>
            </Select>

            {/* Warehouse Filter */}
            {isInCorporateOverview && (
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      {warehouse.warehouse_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Clear Filters */}
          {(dateFrom || dateTo || accountFilter !== 'all' || warehouseFilter !== 'all' || moduleFilter !== 'all' || searchTerm) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
                setAccountFilter('all');
                setWarehouseFilter('all');
                setModuleFilter('all');
                setSearchTerm('');
              }}
              className="border-slate-600 text-slate-300"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50">
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Transaction ID</TableHead>
                  <TableHead className="text-slate-300">Reference</TableHead>
                  <TableHead className="text-slate-300">Description</TableHead>
                  <TableHead className="text-slate-300">Account</TableHead>
                  <TableHead className="text-slate-300 text-right">Debit</TableHead>
                  <TableHead className="text-slate-300 text-right">Credit</TableHead>
                  <TableHead className="text-slate-300">Module</TableHead>
                  {isInCorporateOverview && (
                    <TableHead className="text-slate-300">Warehouse</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={isInCorporateOverview ? 9 : 8} 
                      className="text-center py-8 text-slate-400"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-8 w-8 text-slate-500" />
                        <span>No journal entries found for this period</span>
                        <span className="text-sm text-slate-500">
                          Financial transactions will automatically appear here when invoices, POs, or payments are processed
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-slate-700/50 hover:bg-slate-700/30">
                      <TableCell className="text-slate-300">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {entry.transactionId}
                      </TableCell>
                      <TableCell className="text-slate-400 max-w-32 truncate">
                        {entry.reference}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-48 truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex flex-col">
                          <span className="font-medium">{entry.account}</span>
                          <span className="text-xs text-slate-500 font-mono">
                            {entry.accountCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debitAmount > 0 ? (
                          <span className="text-emerald-400">
                            {formatCurrency(entry.debitAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.creditAmount > 0 ? (
                          <span className="text-red-400">
                            {formatCurrency(entry.creditAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            entry.module === 'invoice' ? 'bg-gray-700/10 text-gray-400 border-gray-600/20' :
                            entry.module === 'purchase_order' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            entry.module === 'bank_transaction' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            entry.module === 'inventory' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            entry.module === 'payroll' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                            entry.module === 'expense' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {entry.module === 'purchase_order' ? 'PO' :
                           entry.module === 'bank_transaction' ? 'Bank' :
                           entry.module === 'manual' ? 'Manual' :
                           entry.module}
                        </Badge>
                      </TableCell>
                      {isInCorporateOverview && (
                        <TableCell>
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                            <Warehouse className="h-3 w-3 mr-1" />
                            {entry.warehouse}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredEntries.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">
                Showing {filteredEntries.length} entries
              </span>
              <div className="flex space-x-6">
                <span className="text-slate-400">
                  Total Debits: <span className="text-emerald-400 font-mono">
                    {formatCurrency(filteredEntries.reduce((sum, entry) => sum + entry.debitAmount, 0))}
                  </span>
                </span>
                <span className="text-slate-400">
                  Total Credits: <span className="text-red-400 font-mono">
                    {formatCurrency(filteredEntries.reduce((sum, entry) => sum + entry.creditAmount, 0))}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};