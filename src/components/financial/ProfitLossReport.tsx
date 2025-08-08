
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

// Sample P&L data
const sampleData = {
  revenue: [
    { category: 'Warehouse Storage Fees', amount: 45280 },
    { category: 'Handling Fees', amount: 28650 },
    { category: 'Shipping Services', amount: 36420 },
    { category: 'Value-Added Services', amount: 12750 }
  ],
  expenses: [
    { category: 'Salaries and Wages', amount: 34200 },
    { category: 'Rent and Facilities', amount: 18500 },
    { category: 'Utilities', amount: 4850 },
    { category: 'Equipment Maintenance', amount: 3640 },
    { category: 'Software Subscriptions', amount: 2250 },
    { category: 'Insurance', amount: 3800 },
    { category: 'Office Supplies', amount: 1250 }
  ]
};

export const ProfitLossReport = () => {
  const totalRevenue = sampleData.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = sampleData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Profit & Loss Statement</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-700/50">
            <CardTitle className="text-lg text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-400" />
              Total Revenue
            </CardTitle>
            <CardDescription className="text-slate-400">Current period</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-700/50">
            <CardTitle className="text-lg text-white flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-rose-400" />
              Total Expenses
            </CardTitle>
            <CardDescription className="text-slate-400">Current period</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-700/50">
            <CardTitle className="text-lg text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-emerald-400" />
              Net Profit
            </CardTitle>
            <CardDescription className="text-slate-400">
              Profit margin: 
              <span className={Number(profitMargin) > 0 ? 'text-emerald-400 ml-1' : 'text-rose-400 ml-1'}>
                {profitMargin}%
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-700/50">
            <CardTitle className="text-lg flex items-center text-white">
              <FileText className="h-5 w-5 mr-2 text-indigo-400" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-800/90">
                <TableRow className="border-slate-700">
                  <TableHead className="font-medium text-slate-300">Category</TableHead>
                  <TableHead className="text-right font-medium text-slate-300">Amount</TableHead>
                  <TableHead className="text-right font-medium text-slate-300">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.revenue.map((item, index) => (
                  <TableRow key={index} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <TableCell className="text-slate-300">{item.category}</TableCell>
                    <TableCell className="text-right text-indigo-300">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right text-slate-400">
                      {((item.amount / totalRevenue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium bg-slate-700/30 border-slate-700">
                  <TableCell className="text-white">Total Revenue</TableCell>
                  <TableCell className="text-right text-indigo-300">{formatCurrency(totalRevenue)}</TableCell>
                  <TableCell className="text-right text-slate-300">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-700/50">
            <CardTitle className="text-lg flex items-center text-white">
              <FileText className="h-5 w-5 mr-2 text-rose-400" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-800/90">
                <TableRow className="border-slate-700">
                  <TableHead className="font-medium text-slate-300">Category</TableHead>
                  <TableHead className="text-right font-medium text-slate-300">Amount</TableHead>
                  <TableHead className="text-right font-medium text-slate-300">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.expenses.map((item, index) => (
                  <TableRow key={index} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <TableCell className="text-slate-300">{item.category}</TableCell>
                    <TableCell className="text-right text-rose-300">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right text-slate-400">
                      {((item.amount / totalExpenses) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium bg-slate-700/30 border-slate-700">
                  <TableCell className="text-white">Total Expenses</TableCell>
                  <TableCell className="text-right text-rose-300">{formatCurrency(totalExpenses)}</TableCell>
                  <TableCell className="text-right text-slate-300">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
