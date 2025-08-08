import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Link, Sparkles, Search } from 'lucide-react';
import { useBankCashManagement } from '@/hooks/useBankCashManagement';
import { useBankTransactions } from '@/hooks/useBankTransactions';
import { useToast } from '@/hooks/use-toast';

export const TransactionMatchingPanel = () => {
  const { toast } = useToast();
  const { bankTransactions } = useBankTransactions();
  const { matchSuggestions, matchTransaction } = useBankCashManagement();
  const [selectedTransaction, setSelectedTransaction] = useState<string>('');
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [manualMatchForm, setManualMatchForm] = useState({
    matchType: '',
    matchId: '',
    description: ''
  });

  const unmatchedTransactions = bankTransactions.filter(t => t.status === 'unmatched');

  const handleAutoMatch = async (suggestion: any) => {
    try {
      await matchTransaction(suggestion.transactionId, suggestion.matchType, suggestion.matchId);
      toast({ title: "Transaction matched successfully" });
    } catch (error) {
      toast({ title: "Failed to match transaction", variant: "destructive" });
    }
  };

  const handleManualMatch = async () => {
    if (!selectedTransaction || !manualMatchForm.matchType || !manualMatchForm.matchId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await matchTransaction(selectedTransaction, manualMatchForm.matchType, manualMatchForm.matchId);
      setIsManualMatchOpen(false);
      setManualMatchForm({ matchType: '', matchId: '', description: '' });
      toast({ title: "Transaction matched manually" });
    } catch (error) {
      toast({ title: "Failed to match transaction", variant: "destructive" });
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">High</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200">Low</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Auto-Match Suggestions */}
      {matchSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Auto-Match Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchSuggestions.slice(0, 5).map((suggestion, index) => {
                const transaction = unmatchedTransactions.find(t => t.id === suggestion.transactionId);
                if (!transaction) return null;

                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{transaction.description}</span>
                        <Badge variant={transaction.transaction_type === 'credit' ? 'default' : 'outline'}>
                          {transaction.transaction_type === 'credit' ? 'Incoming' : 'Outgoing'}
                        </Badge>
                        {getConfidenceBadge(suggestion.confidence)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(transaction.amount)} → {suggestion.matchDescription}
                      </div>
                    </div>
                    <Button onClick={() => handleAutoMatch(suggestion)} size="sm">
                      <Link className="h-4 w-4 mr-2" />
                      Match
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmatched Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unmatched Transactions</CardTitle>
          <Dialog open={isManualMatchOpen} onOpenChange={setIsManualMatchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Manual Match
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Transaction Match</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Transaction</Label>
                  <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unmatched transaction" />
                    </SelectTrigger>
                    <SelectContent>
                      {unmatchedTransactions.map((transaction) => (
                        <SelectItem key={transaction.id} value={transaction.id}>
                          {transaction.description} - {formatCurrency(transaction.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Match Type</Label>
                  <Select 
                    value={manualMatchForm.matchType} 
                    onValueChange={(value) => setManualMatchForm(prev => ({ ...prev, matchType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select match type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Customer Invoice</SelectItem>
                      <SelectItem value="bill">Vendor Bill</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Match ID/Reference</Label>
                  <Input
                    value={manualMatchForm.matchId}
                    onChange={(e) => setManualMatchForm(prev => ({ ...prev, matchId: e.target.value }))}
                    placeholder="Enter invoice #, bill #, or reference"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={manualMatchForm.description}
                    onChange={(e) => setManualMatchForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional description"
                  />
                </div>
                <Button onClick={handleManualMatch} className="w-full">
                  Match Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {unmatchedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              All transactions are matched!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatchedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <span className={transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.transaction_type === 'credit' ? 'default' : 'outline'}>
                        {transaction.transaction_type === 'credit' ? 'Incoming' : 'Outgoing'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">Unmatched</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};