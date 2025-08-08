import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpCircle, ArrowDownCircle, Filter, Download, Link2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useBankConnections } from '@/hooks/useBankConnections';
import { useToast } from '@/hooks/use-toast';

export const TransactionFeedWidget = () => {
  const { toast } = useToast();
  const { transactions, connectedAccounts, matchTransaction, syncTransactions, isLoading } = useBankConnections();
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncTransactions = async () => {
    setIsSyncing(true);
    try {
      await syncTransactions();
      toast({ 
        title: "Transactions synced", 
        description: "Latest transactions have been imported" 
      });
    } catch (error) {
      toast({ 
        title: "Sync failed", 
        description: "Unable to sync transactions",
        variant: "destructive" 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMatchTransaction = async (matchType: 'invoice' | 'bill' | 'payroll', matchId: string) => {
    if (!selectedTransaction) return;

    try {
      await matchTransaction(selectedTransaction, matchType, matchId);
      setIsMatchDialogOpen(false);
      setSelectedTransaction(null);
      toast({ 
        title: "Transaction matched", 
        description: "Transaction has been matched successfully" 
      });
    } catch (error) {
      toast({ 
        title: "Match failed", 
        description: "Unable to match transaction",
        variant: "destructive" 
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unmatched':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'credit' || amount > 0) {
      return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAccount = accountFilter === 'all' || transaction.bank_account_id === accountFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.transaction_date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    }

    return matchesSearch && matchesAccount && matchesStatus && matchesType && matchesDate;
  });

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Amount', 'Type', 'Status', 'Reference', 'Account'].join(','),
      ...filteredTransactions.map(t => [
        t.transaction_date,
        `"${t.description}"`,
        t.amount,
        t.transaction_type,
        t.status,
        t.reference_number || '',
        connectedAccounts.find(acc => acc.id === t.bank_account_id)?.bank_name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Transaction Feed</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncTransactions}
            disabled={isSyncing}
          >
            <ArrowDownCircle className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Refresh Feed'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value="all">All Accounts</SelectItem>
              {connectedAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.bank_name} - ****{account.account_number.slice(-4)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="unmatched">Unmatched</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Credits</SelectItem>
              <SelectItem value="debit">Debits</SelectItem>
            </SelectContent>
          </Select>

          <div className="xl:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">Loading transactions...</span>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Filter className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">No transactions found</p>
                        <p className="text-sm text-muted-foreground">
                          {transactions.length === 0 
                            ? "Connect a bank account to see transactions" 
                            : "Try adjusting your filters or search terms"
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => {
                  const account = connectedAccounts.find(acc => acc.id === transaction.bank_account_id);
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transaction_type, transaction.amount)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.reference_number && (
                              <p className="text-sm text-muted-foreground">
                                Ref: {transaction.reference_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {account ? (
                          <div>
                            <p className="font-medium">{account.bank_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ****{account.account_number.slice(-4)}
                            </p>
                          </div>
                        ) : (
                          'Unknown Account'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <Badge variant={
                            transaction.status === 'matched' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.status === 'unmatched' && (
                          <Dialog open={isMatchDialogOpen && selectedTransaction === transaction.id} onOpenChange={setIsMatchDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTransaction(transaction.id)}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Match
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Match Transaction</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="font-medium">{transaction.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(transaction.amount)} • {formatDate(transaction.transaction_date)}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Match with:</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleMatchTransaction('invoice', 'example-invoice-id')}
                                    >
                                      Match with Invoice
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleMatchTransaction('bill', 'example-bill-id')}
                                    >
                                      Match with Bill
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleMatchTransaction('payroll', 'example-payroll-id')}
                                    >
                                      Match with Payroll
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};