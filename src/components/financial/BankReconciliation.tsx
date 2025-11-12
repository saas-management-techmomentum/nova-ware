import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Download, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useBankTransactions } from '@/hooks/useBankTransactions';
import { useToast } from '@/hooks/use-toast';
import { BankDashboard } from './BankDashboard';
import { TransactionMatchingPanel } from './TransactionMatchingPanel';
import { PettyCashManager } from './PettyCashManager';
import { BankConnectionWidget } from './BankConnectionWidget';
import { TransactionFeedWidget } from './TransactionFeedWidget';
import { CSVUploadWidget } from './CSVUploadWidget';

export const BankReconciliation = () => {
  const { toast } = useToast();
  const { bankAccounts, addBankAccount, deleteBankAccount, isLoading: accountsLoading } = useBankAccounts();
  const { bankTransactions, addBankTransaction, updateTransactionStatus, isLoading: transactionsLoading } = useBankTransactions();
  
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'checking',
    currency: 'USD',
    openingBalance: ''
  });
  
  const [transactionForm, setTransactionForm] = useState({
    bankAccountId: '',
    transactionDate: '',
    description: '',
    referenceNumber: '',
    amount: '',
    transactionType: 'debit'
  });

  const handleAddAccount = async () => {
    try {
      await addBankAccount({
        bank_name: accountForm.bankName,
        account_number: accountForm.accountNumber,
        account_type: accountForm.accountType,
        currency: accountForm.currency,
        current_balance: parseFloat(accountForm.openingBalance) || 0,
        opening_balance: parseFloat(accountForm.openingBalance) || 0
      });
      
      setAccountForm({
        bankName: '',
        accountNumber: '',
        accountType: 'checking',
        currency: 'USD',
        openingBalance: ''
      });
      setIsAddAccountOpen(false);
      toast({ title: "Bank account added successfully" });
    } catch (error) {
      toast({ title: "Failed to add bank account", variant: "destructive" });
    }
  };

  const handleAddTransaction = async () => {
    try {
      await addBankTransaction({
        bank_account_id: transactionForm.bankAccountId,
        transaction_date: transactionForm.transactionDate,
        description: transactionForm.description,
        reference_number: transactionForm.referenceNumber,
        amount: parseFloat(transactionForm.amount),
        transaction_type: transactionForm.transactionType as 'debit' | 'credit'
      });
      
      setTransactionForm({
        bankAccountId: '',
        transactionDate: '',
        description: '',
        referenceNumber: '',
        amount: '',
        transactionType: 'debit'
      });
      setIsAddTransactionOpen(false);
      toast({ title: "Transaction added successfully" });
    } catch (error) {
      toast({ title: "Failed to add transaction", variant: "destructive" });
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      // TODO: Implement CSV parsing and bulk import
      toast({ title: "CSV file selected", description: "CSV import functionality will be implemented" });
    } else {
      toast({ title: "Invalid file type", description: "Please select a CSV file", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteBankAccount(accountId);
      setDeleteAccountId(null);
      toast({ title: "Bank account deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete bank account", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (transactionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'matched' ? 'unmatched' : 'matched';
    try {
      await updateTransactionStatus(transactionId, newStatus);
      toast({ title: `Transaction marked as ${newStatus}` });
    } catch (error) {
      toast({ title: "Failed to update transaction status", variant: "destructive" });
    }
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

  const filteredTransactions = selectedAccount && selectedAccount !== 'all'
    ? bankTransactions.filter(t => t.bank_account_id === selectedAccount)
    : bankTransactions;

  const exportToCsv = () => {
    const csvContent = [
      ['Date', 'Description', 'Reference', 'Amount', 'Type', 'Status'].join(','),
      ...filteredTransactions.map(t => [
        t.transaction_date,
        `"${t.description}"`,
        t.reference_number || '',
        t.amount,
        t.transaction_type,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank_reconciliation.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (accountsLoading || transactionsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Bank & Cash Management</h2>
        <div className="flex gap-2">
          <Button onClick={exportToCsv} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="connections">Bank Connections</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Feed</TabsTrigger>
          <TabsTrigger value="csv-upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="accounts">Manual Accounts</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="petty-cash">Petty Cash</TabsTrigger>
          <TabsTrigger value="reconciliation">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            <BankDashboard />
            <BankConnectionWidget />
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <BankConnectionWidget />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionFeedWidget />
        </TabsContent>

        <TabsContent value="csv-upload">
          <CSVUploadWidget />
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Accounts</CardTitle>
              <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Bank Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="e.g., Wells Fargo"
                      />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={accountForm.accountNumber}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="e.g., ****1234"
                      />
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Select
                        value={accountForm.accountType}
                        onValueChange={(value) => setAccountForm(prev => ({ ...prev, accountType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={accountForm.currency}
                        onValueChange={(value) => setAccountForm(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Opening Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={accountForm.openingBalance}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, openingBalance: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <Button onClick={handleAddAccount} className="w-full">
                      Add Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.bank_name}</TableCell>
                      <TableCell>{account.account_number}</TableCell>
                      <TableCell className="capitalize">{account.account_type}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>${account.current_balance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteAccountId(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Transactions</CardTitle>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="csv-upload">Import CSV:</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="w-auto"
                  />
                </div>
                <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Bank Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Bank Account</Label>
                        <Select
                          value={transactionForm.bankAccountId}
                          onValueChange={(value) => setTransactionForm(prev => ({ ...prev, bankAccountId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.bank_name} - {account.account_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Transaction Date</Label>
                        <Input
                          type="date"
                          value={transactionForm.transactionDate}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, transactionDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Transaction description"
                        />
                      </div>
                      <div>
                        <Label>Reference Number</Label>
                        <Input
                          value={transactionForm.referenceNumber}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                          placeholder="Optional reference"
                        />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={transactionForm.amount}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Transaction Type</Label>
                        <Select
                          value={transactionForm.transactionType}
                          onValueChange={(value) => setTransactionForm(prev => ({ ...prev, transactionType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddTransaction} className="w-full">
                        Add Transaction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Filter by Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.transaction_date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.reference_number || '-'}</TableCell>
                      <TableCell>
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className="capitalize">{transaction.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(transaction.id, transaction.status)}
                        >
                          Mark as {transaction.status === 'matched' ? 'Unmatched' : 'Matched'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matching">
          <TransactionMatchingPanel />
        </TabsContent>

        <TabsContent value="petty-cash">
          <PettyCashManager />
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {filteredTransactions.filter(t => t.status === 'matched').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Matched Transactions</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {filteredTransactions.filter(t => t.status === 'unmatched').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Unmatched Transactions</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {filteredTransactions.filter(t => t.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending Review</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Matched transactions are reconciled with the general ledger</p>
                <p>• Unmatched transactions require manual review or GL entry</p>
                <p>• Pending transactions are awaiting verification</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this bank account? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteAccountId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteAccountId && handleDeleteAccount(deleteAccountId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};