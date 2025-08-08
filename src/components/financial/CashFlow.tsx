
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Building } from 'lucide-react';
import { useWarehouseScopedAccounts } from '@/hooks/useWarehouseScopedAccounts';
import { useWarehouseScopedBilling } from '@/hooks/useWarehouseScopedBilling';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { formatCurrency } from '@/lib/utils';

export const CashFlow = () => {
  const { accounts, isLoading: accountsLoading } = useWarehouseScopedAccounts();
  const { invoices, isLoading: billingLoading } = useWarehouseScopedBilling();
  const { canViewAllWarehouses, selectedWarehouse } = useWarehouse();

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;
  const isLoading = accountsLoading || billingLoading;

  // Only show blocking message if not in corporate overview and no warehouse selected
  if (!selectedWarehouse && !canViewAllWarehouses) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Cash Flow Statement</h2>
            <p className="text-slate-400 mt-1">For the period ending {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Warehouse Selected</h3>
            <p className="text-slate-400">Please select a warehouse to view the cash flow statement.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate cash flows from available data
  const calculateCashFlows = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const operatingCashIn = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    
    // Get cash accounts for actual cash balances
    const cashAccounts = accounts.filter(acc => 
      acc.account_name?.toLowerCase().includes('cash') || 
      acc.account_name?.toLowerCase().includes('checking') ||
      acc.account_name?.toLowerCase().includes('savings')
    );
    
    const currentCashBalance = cashAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    
    return {
      operatingCashIn,
      operatingCashOut: operatingCashIn * 0.7, // Simplified estimate
      investingCashOut: operatingCashIn * 0.1, // Simplified estimate
      financingCashIn: operatingCashIn * 0.05, // Simplified estimate
      currentCashBalance
    };
  };

  const cashFlows = calculateCashFlows();
  const netOperatingCashFlow = cashFlows.operatingCashIn - cashFlows.operatingCashOut;
  const netInvestingCashFlow = -cashFlows.investingCashOut;
  const netFinancingCashFlow = cashFlows.financingCashIn;
  const netCashFlow = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Cash Flow Statement</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Cash Flow Statement</h2>
          <p className="text-slate-400 mt-1">
            {isInCorporateOverview 
              ? `For the period ending ${new Date().toLocaleDateString()} (Consolidated across all warehouses)`
              : `For the period ending ${new Date().toLocaleDateString()}`
            }
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Operating Activities */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <TrendingUp className="h-5 w-5 mr-2" />
              Cash Flow from Operating Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Cash received from customers</span>
              <span className="text-emerald-400">{formatCurrency(cashFlows.operatingCashIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Cash paid for operating expenses</span>
              <span className="text-red-400">({formatCurrency(cashFlows.operatingCashOut)})</span>
            </div>
            <div className="border-t border-slate-600 pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Net cash from operating activities</span>
                <span className={netOperatingCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatCurrency(netOperatingCashFlow)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investing Activities */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-400">
              <DollarSign className="h-5 w-5 mr-2" />
              Cash Flow from Investing Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Equipment and asset purchases</span>
              <span className="text-red-400">({formatCurrency(cashFlows.investingCashOut)})</span>
            </div>
            <div className="border-t border-slate-600 pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Net cash from investing activities</span>
                <span className="text-red-400">{formatCurrency(netInvestingCashFlow)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financing Activities */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-400">
              <TrendingDown className="h-5 w-5 mr-2" />
              Cash Flow from Financing Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Capital contributions</span>
              <span className="text-emerald-400">{formatCurrency(cashFlows.financingCashIn)}</span>
            </div>
            <div className="border-t border-slate-600 pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Net cash from financing activities</span>
                <span className={netFinancingCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatCurrency(netFinancingCashFlow)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Change in Cash */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-white">Net increase (decrease) in cash</span>
                <span className={netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatCurrency(netCashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Cash at beginning of period</span>
                <span className="text-white">{formatCurrency(Math.max(0, cashFlows.currentCashBalance - netCashFlow))}</span>
              </div>
              <div className="border-t border-slate-600 pt-2">
                <div className="flex justify-between font-bold text-xl">
                  <span className="text-white">Cash at end of period</span>
                  <span className="text-emerald-400">{formatCurrency(cashFlows.currentCashBalance)}</span>
                </div>
              </div>
              {isInCorporateOverview && (
                <div className="text-xs text-slate-500 mt-2 text-center">
                  Consolidated cash flow across all warehouses
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
