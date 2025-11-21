import React from 'react';
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
import { JournalEntry } from '@/hooks/useGeneralLedger';
import { FileText, Calendar, User, Hash, ExternalLink } from 'lucide-react';

interface JournalEntryDetailDialogProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JournalEntryDetailDialog: React.FC<JournalEntryDetailDialogProps> = ({
  entry,
  isOpen,
  onClose,
}) => {
  if (!entry) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'posted': 'bg-green-500/20 text-green-400 border-green-500/30',
      'draft': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'voided': 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-slate-500/20 text-slate-400'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const totalDebits = entry.lines?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) || 0;
  const totalCredits = entry.lines?.reduce((sum, line) => sum + (line.credit_amount || 0), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Journal Entry Details
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Complete information for journal entry {entry.entry_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entry Header */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Entry Information
                {getStatusBadge(entry.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Entry Number:</span>
                    <span className="font-medium text-white">{entry.entry_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Entry Date:</span>
                    <span className="font-medium text-white">{formatDate(entry.entry_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Created By:</span>
                    <span className="font-medium text-white">{entry.created_by}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-400">Total Amount:</span>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(entry.total_amount)}
                    </div>
                  </div>
                  {entry.reference && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Reference:</span>
                      <span className="font-medium text-blue-400">{entry.reference}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-slate-400">Created:</span>
                    <div className="text-sm text-slate-300">{formatDateTime(entry.created_at)}</div>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-400">Description:</span>
                <p className="mt-1 text-white">{entry.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Journal Lines */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Journal Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Account</TableHead>
                    <TableHead className="text-slate-300">Description</TableHead>
                    <TableHead className="text-slate-300 text-right">Debit</TableHead>
                    <TableHead className="text-slate-300 text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines?.map((line) => (
                    <TableRow key={line.id} className="border-slate-700 hover:bg-slate-800/30">
                      <TableCell>
                        <div className="text-white">
                          {line.account?.account_code} - {line.account?.account_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {line.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.debit_amount > 0 ? (
                          <span className="font-medium text-green-400">
                            {formatCurrency(line.debit_amount)}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.credit_amount > 0 ? (
                          <span className="font-medium text-red-400">
                            {formatCurrency(line.credit_amount)}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Total Debits</div>
                    <div className="text-xl font-bold text-green-400">
                      {formatCurrency(totalDebits)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Total Credits</div>
                    <div className="text-xl font-bold text-red-400">
                      {formatCurrency(totalCredits)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400">Balance</div>
                    <div className={`text-xl font-bold ${
                      Math.abs(totalDebits - totalCredits) < 0.01 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(totalDebits - totalCredits)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};