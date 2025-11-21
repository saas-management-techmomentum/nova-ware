import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGeneralLedger, TrialBalanceItem } from '@/hooks/useGeneralLedger';
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface TrialBalanceReportProps {
  className?: string;
}

export const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({ className }) => {
  const { getTrialBalance } = useGeneralLedger();
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrialBalance();
  }, []);

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const data = await getTrialBalance();
      setTrialBalance(data);
    } catch (error) {
      console.error('Error loading trial balance:', error);
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

  const exportToCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Total Debits', 'Total Credits', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...trialBalance.map(item => [
        item.account_code,
        `"${item.account_name}"`,
        item.total_debits.toFixed(2),
        item.total_credits.toFixed(2),
        item.balance.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trial-balance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateTotals = () => {
    return trialBalance.reduce(
      (totals, item) => ({
        totalDebits: totals.totalDebits + item.total_debits,
        totalCredits: totals.totalCredits + item.total_credits,
        totalBalance: totals.totalBalance + item.balance
      }),
      { totalDebits: 0, totalCredits: 0, totalBalance: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Trial Balance Report</CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={loadTrialBalance}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportToCSV}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-400">Loading trial balance...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Debits</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(totals.totalDebits)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Total Credits</div>
                  <div className="text-xl font-bold text-red-400">
                    {formatCurrency(totals.totalCredits)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Net Difference</div>
                  <div className={`text-xl font-bold ${
                    Math.abs(totals.totalBalance) < 0.01 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(totals.totalBalance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trial Balance Table */}
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Account Code</TableHead>
                  <TableHead className="text-slate-300">Account Name</TableHead>
                  <TableHead className="text-slate-300 text-right">Total Debits</TableHead>
                  <TableHead className="text-slate-300 text-right">Total Credits</TableHead>
                  <TableHead className="text-slate-300 text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.map((item, index) => (
                  <TableRow key={`${item.account_code}-${index}`} className="border-slate-700 hover:bg-slate-800/30">
                    <TableCell className="font-medium text-blue-400">
                      {item.account_code}
                    </TableCell>
                    <TableCell className="text-white">
                      {item.account_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.total_debits > 0 ? (
                        <span className="font-medium text-green-400">
                          {formatCurrency(item.total_debits)}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.total_credits > 0 ? (
                        <span className="font-medium text-red-400">
                          {formatCurrency(item.total_credits)}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        item.balance > 0 ? 'text-green-400' : 
                        item.balance < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {formatCurrency(item.balance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="border-slate-700 bg-slate-700/30">
                  <TableCell className="font-bold text-white" colSpan={2}>
                    TOTALS
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-400">
                    {formatCurrency(totals.totalDebits)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-400">
                    {formatCurrency(totals.totalCredits)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    Math.abs(totals.totalBalance) < 0.01 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(totals.totalBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {trialBalance.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No accounts found in the trial balance
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};