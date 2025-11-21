import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building, FileText, CreditCard, Calendar } from 'lucide-react';

interface VendorLedgerDialogProps {
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VendorTransaction {
  id: string;
  type: 'bill' | 'payment' | 'credit';
  date: string;
  reference: string;
  description: string;
  amount: number;
  balance_effect: number;
  status?: string;
}

export const VendorLedgerDialog: React.FC<VendorLedgerDialogProps> = ({
  vendorName,
  isOpen,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [vendorSummary, setVendorSummary] = useState({
    totalBilled: 0,
    totalPaid: 0,
    currentBalance: 0,
    lastPaymentDate: null as string | null,
    nextDueDate: null as string | null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && vendorName) {
      fetchVendorLedger();
    }
  }, [isOpen, vendorName]);

  const fetchVendorLedger = async () => {
    setLoading(true);
    try {
      // Fetch all bills for this vendor
      const { data: bills, error: billsError } = await supabase
        .from('vendor_bills' as any)
        .select('*')
        .eq('vendor_name', vendorName)
        .order('issue_date', { ascending: false });

      if (billsError) throw billsError;

      // Fetch all payments for bills from this vendor
      const billIds = bills?.map((bill: any) => bill.id) || [];
      const { data: payments, error: paymentsError } = await supabase
        .from('vendor_bill_payments' as any)
        .select('*')
        .in('bill_id', billIds)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Combine and format transactions
      const allTransactions: VendorTransaction[] = [];

      // Add bills
      bills?.forEach((bill: any) => {
        allTransactions.push({
          id: bill.id,
          type: 'bill',
          date: bill.issue_date,
          reference: bill.bill_number,
          description: bill.description || `Invoice from ${vendorName}`,
          amount: bill.amount,
          balance_effect: bill.amount - bill.paid_amount, // Outstanding amount
          status: bill.status
        });
      });

      // Add payments
      payments?.forEach((payment: any) => {
        allTransactions.push({
          id: payment.id,
          type: 'payment',
          date: payment.payment_date,
          reference: payment.reference_number || 'Payment',
          description: `Payment - ${payment.payment_method}`,
          amount: payment.payment_amount,
          balance_effect: -payment.payment_amount // Reduces balance
        });
      });

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);

      // Calculate vendor summary
      const totalBilled = bills?.reduce((sum: number, bill: any) => sum + bill.amount, 0) || 0;
      const totalPaid = payments?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
      const currentBalance = totalBilled - totalPaid;

      const paymentsData = payments as any[];
      const billsData = bills as any[];
      
      const lastPaymentDate = paymentsData && paymentsData.length > 0 
        ? paymentsData[0].payment_date 
        : null;

      const upcomingBills = billsData?.filter((bill: any) => bill.status !== 'paid') || [];
      const nextDueDate = upcomingBills.length > 0 
        ? upcomingBills.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date
        : null;

      setVendorSummary({
        totalBilled,
        totalPaid,
        currentBalance,
        lastPaymentDate,
        nextDueDate
      });

    } catch (error) {
      console.error('Error fetching vendor ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'bill':
        return <FileText className="h-4 w-4 text-red-400" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      'paid': 'bg-green-500/20 text-green-400 border-green-500/30',
      'unpaid': 'bg-red-500/20 text-red-400 border-red-500/30',
      'partially_paid': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'overdue': 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-slate-500/20 text-slate-400'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-400" />
            Vendor Ledger - {vendorName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Complete transaction history and account summary
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-400">Loading vendor data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vendor Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Billed</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(vendorSummary.totalBilled)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Paid</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(vendorSummary.totalPaid)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Current Balance</div>
                  <div className={`text-xl font-bold ${vendorSummary.currentBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(vendorSummary.currentBalance)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Next Due</div>
                  <div className="text-sm font-medium text-white">
                    {vendorSummary.nextDueDate ? formatDate(vendorSummary.nextDueDate) : 'None'}
                  </div>
                  {vendorSummary.lastPaymentDate && (
                    <div className="text-xs text-slate-400 mt-1">
                      Last paid: {formatDate(vendorSummary.lastPaymentDate)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Reference</TableHead>
                      <TableHead className="text-slate-300">Description</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Balance Effect</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-slate-700 hover:bg-slate-800/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="text-white capitalize">{transaction.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell className="text-blue-400 font-medium">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className={`font-medium ${
                          transaction.balance_effect >= 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {transaction.balance_effect >= 0 ? '+' : ''}{formatCurrency(transaction.balance_effect)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {transactions.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No transactions found for this vendor
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Generate Statement
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};