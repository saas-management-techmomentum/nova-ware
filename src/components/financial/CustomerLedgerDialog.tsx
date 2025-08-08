import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { User, FileText, Send, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    contact_email: string;
  } | null;
}

interface LedgerEntry {
  id: string;
  type: 'invoice' | 'payment' | 'credit';
  date: string;
  description: string;
  reference: string;
  debit?: number;
  credit?: number;
  balance: number;
}

export const CustomerLedgerDialog: React.FC<CustomerLedgerDialogProps> = ({
  open,
  onOpenChange,
  customer
}) => {
  const { user } = useAuth();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    outstandingBalance: 0
  });

  const fetchCustomerLedger = async () => {
    if (!customer?.id || !user?.id) return;

    setIsLoading(true);
    try {
      // Fetch customer invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', customer.id)
        .eq('user_id', user.id)
        .order('invoice_date', { ascending: true });

      if (invoicesError) throw invoicesError;

      // Fetch payments for these invoices
      const invoiceIds = invoices.map(inv => inv.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('invoice_payments')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('payment_date', { ascending: true });

      if (paymentsError) throw paymentsError;

      // Build ledger entries
      const entries: LedgerEntry[] = [];
      let runningBalance = 0;

      // Add invoices
      invoices.forEach(invoice => {
        runningBalance += invoice.total_amount;
        entries.push({
          id: invoice.id,
          type: 'invoice',
          date: invoice.invoice_date,
          description: `Invoice ${invoice.invoice_number}`,
          reference: invoice.invoice_number,
          debit: invoice.total_amount,
          balance: runningBalance
        });
      });

      // Add payments
      payments.forEach(payment => {
        runningBalance -= payment.amount;
        const invoice = invoices.find(inv => inv.id === payment.invoice_id);
        entries.push({
          id: payment.id,
          type: 'payment',
          date: payment.payment_date,
          description: `Payment - ${payment.payment_method}`,
          reference: payment.reference_number || `PMT-${payment.id.slice(-6)}`,
          credit: payment.amount,
          balance: runningBalance
        });
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Recalculate running balances
      let balance = 0;
      entries.forEach(entry => {
        if (entry.debit) balance += entry.debit;
        if (entry.credit) balance -= entry.credit;
        entry.balance = balance;
      });

      setLedgerEntries(entries);

      // Calculate summary
      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
      setSummary({
        totalInvoiced,
        totalPaid,
        outstandingBalance: totalInvoiced - totalPaid
      });

    } catch (error) {
      console.error('Error fetching customer ledger:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'payment':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'credit':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const sendStatement = () => {
    // Implementation for sending customer statement
    console.log('Sending statement to customer:', customer?.contact_email);
  };

  const exportLedger = () => {
    // Implementation for exporting ledger data
    console.log('Exporting ledger for customer:', customer?.name);
  };

  useEffect(() => {
    if (open && customer) {
      fetchCustomerLedger();
    }
  }, [open, customer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            Customer Ledger - {customer?.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Complete transaction history and outstanding balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
              <div className="text-sm text-blue-400 font-medium">Total Invoiced</div>
              <div className="text-xl font-bold text-white mt-1">
                {formatCurrency(summary.totalInvoiced)}
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
              <div className="text-sm text-green-400 font-medium">Total Paid</div>
              <div className="text-xl font-bold text-white mt-1">
                {formatCurrency(summary.totalPaid)}
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
              <div className="text-sm text-orange-400 font-medium">Outstanding Balance</div>
              <div className="text-xl font-bold text-white mt-1">
                {formatCurrency(summary.outstandingBalance)}
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={sendStatement}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Statement
            </Button>
            <Button 
              onClick={exportLedger}
              variant="outline"
              className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Ledger
            </Button>
          </div>

          {/* Ledger Table */}
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Type</TableHead>
                  <TableHead className="text-slate-300">Description</TableHead>
                  <TableHead className="text-slate-300">Reference</TableHead>
                  <TableHead className="text-slate-300 text-right">Debit</TableHead>
                  <TableHead className="text-slate-300 text-right">Credit</TableHead>
                  <TableHead className="text-slate-300 text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      Loading ledger entries...
                    </TableCell>
                  </TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      No transactions found for this customer
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry) => (
                    <TableRow key={`${entry.type}-${entry.id}`} className="border-slate-700 hover:bg-slate-800/30">
                      <TableCell className="text-slate-300">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{entry.description}</TableCell>
                      <TableCell className="text-slate-300">{entry.reference}</TableCell>
                      <TableCell className="text-right text-red-400">
                        {entry.debit ? formatCurrency(entry.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-green-400">
                        {entry.credit ? formatCurrency(entry.credit) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-white font-medium">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};