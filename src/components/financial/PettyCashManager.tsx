import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { useBankCashManagement } from '@/hooks/useBankCashManagement';
import { useToast } from '@/hooks/use-toast';

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel & Transportation',
  'Meals & Entertainment',
  'Postage & Shipping',
  'Utilities',
  'Maintenance & Repairs',
  'Equipment',
  'Marketing & Advertising',
  'Professional Services',
  'Bank Fees',
  'Other'
];

export const PettyCashManager = () => {
  const { toast } = useToast();
  const { pettyCashEntries, dashboardMetrics, addPettyCashEntry } = useBankCashManagement();
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    referenceNumber: ''
  });

  const handleAddEntry = async () => {
    if (!entryForm.description || !entryForm.amount || !entryForm.category) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await addPettyCashEntry({
        date: entryForm.date,
        description: entryForm.description,
        amount: parseFloat(entryForm.amount),
        category: entryForm.category,
        reference_number: entryForm.referenceNumber || undefined
      });

      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: '',
        referenceNumber: ''
      });
      setIsAddEntryOpen(false);
      toast({ title: "Petty cash entry added successfully" });
    } catch (error) {
      toast({ title: "Failed to add petty cash entry", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalExpenses = pettyCashEntries
    .filter(entry => entry.amount < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

  const totalDeposits = pettyCashEntries
    .filter(entry => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Petty Cash Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(dashboardMetrics.pettyCashBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deposits
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalDeposits)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Petty Cash Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Petty Cash Ledger</CardTitle>
          <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Petty Cash Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={entryForm.date}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={entryForm.description}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the transaction"
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entryForm.amount}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount (negative for expenses, positive for deposits)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use negative amounts for expenses (e.g., -25.00) and positive for deposits (e.g., 100.00)
                  </p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={entryForm.category} 
                    onValueChange={(value) => setEntryForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number (Optional)</Label>
                  <Input
                    value={entryForm.referenceNumber}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="Receipt #, check #, etc."
                  />
                </div>
                <Button onClick={handleAddEntry} className="w-full">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pettyCashEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No petty cash entries found
                  </TableCell>
                </TableRow>
              ) : (
                pettyCashEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.category}</Badge>
                    </TableCell>
                    <TableCell>{entry.reference_number || '-'}</TableCell>
                    <TableCell>
                      <span className={entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(entry.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.amount >= 0 ? 'default' : 'destructive'}>
                        {entry.amount >= 0 ? 'Deposit' : 'Expense'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};