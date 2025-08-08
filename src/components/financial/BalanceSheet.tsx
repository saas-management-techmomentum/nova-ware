
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, CreditCard, DollarSign } from 'lucide-react';
import { useWarehouseScopedAccounts } from '@/hooks/useWarehouseScopedAccounts';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { formatCurrency } from '@/lib/utils';

export const BalanceSheet = () => {
  const { accounts, accountTypes, isLoading } = useWarehouseScopedAccounts();
  const { canViewAllWarehouses, selectedWarehouse } = useWarehouse();

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  // Only show blocking message if not in corporate overview and no warehouse selected
  if (!selectedWarehouse && !canViewAllWarehouses) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Balance Sheet</h2>
            <p className="text-slate-400 mt-1">Assets, Liabilities, and Equity</p>
          </div>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Warehouse Selected</h3>
            <p className="text-slate-400">Please select a warehouse to view the balance sheet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAccountsByCategory = (category: string) => {
    const categoryTypes = accountTypes.filter(type => type.category === category);
    return categoryTypes.reduce((acc, type) => {
      const typeAccounts = accounts.filter(account => account.account_type_id === type.id);
      if (typeAccounts.length > 0) {
        acc.push({ type, accounts: typeAccounts });
      }
      return acc;
    }, [] as Array<{ type: any; accounts: any[] }>);
  };

  const calculateCategoryTotal = (category: string) => {
    const categoryAccounts = getAccountsByCategory(category);
    return categoryAccounts.reduce((total, { accounts: typeAccounts }) => {
      return total + typeAccounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);
    }, 0);
  };

  const assetsTotal = calculateCategoryTotal('assets');
  const liabilitiesTotal = calculateCategoryTotal('liabilities');
  const equityTotal = calculateCategoryTotal('equity');
  const totalLiabilitiesAndEquity = liabilitiesTotal + equityTotal;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Balance Sheet</h2>
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
          <h2 className="text-2xl font-bold text-white">Balance Sheet</h2>
          <p className="text-slate-400 mt-1">
            {isInCorporateOverview 
              ? `Assets, Liabilities, and Equity (Consolidated across all warehouses) as of ${new Date().toLocaleDateString()}`
              : `Assets, Liabilities, and Equity as of ${new Date().toLocaleDateString()}`
            }
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assets */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-400">
              <Building className="h-5 w-5 mr-2" />
              Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getAccountsByCategory('assets').map(({ type, accounts: typeAccounts }) => (
              <div key={type.id}>
                <h4 className="font-medium text-slate-300 mb-2">{type.name}</h4>
                <div className="space-y-1 ml-4">
                  {typeAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="text-slate-400">{account.account_name}</span>
                        {isInCorporateOverview && account.warehouse_name && (
                          <div className="text-xs text-slate-500 ml-2">
                            ({account.warehouse_name})
                          </div>
                        )}
                      </div>
                      <span className="text-white">{formatCurrency(account.current_balance || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-slate-600 pt-2 mt-4">
              <div className="flex justify-between font-semibold text-emerald-400">
                <span>Total Assets</span>
                <span>{formatCurrency(assetsTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <div className="space-y-6">
          {/* Liabilities */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-400">
                <CreditCard className="h-5 w-5 mr-2" />
                Liabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getAccountsByCategory('liabilities').map(({ type, accounts: typeAccounts }) => (
                <div key={type.id}>
                  <h4 className="font-medium text-slate-300 mb-2">{type.name}</h4>
                  <div className="space-y-1 ml-4">
                    {typeAccounts.map((account) => (
                      <div key={account.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="text-slate-400">{account.account_name}</span>
                          {isInCorporateOverview && account.warehouse_name && (
                            <div className="text-xs text-slate-500 ml-2">
                              ({account.warehouse_name})
                            </div>
                          )}
                        </div>
                        <span className="text-white">{formatCurrency(account.current_balance || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-600 pt-2 mt-4">
                <div className="flex justify-between font-medium text-red-400">
                  <span>Total Liabilities</span>
                  <span>{formatCurrency(liabilitiesTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equity */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-400">
                <DollarSign className="h-5 w-5 mr-2" />
                Equity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getAccountsByCategory('equity').map(({ type, accounts: typeAccounts }) => (
                <div key={type.id}>
                  <h4 className="font-medium text-slate-300 mb-2">{type.name}</h4>
                  <div className="space-y-1 ml-4">
                    {typeAccounts.map((account) => (
                      <div key={account.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="text-slate-400">{account.account_name}</span>
                          {isInCorporateOverview && account.warehouse_name && (
                            <div className="text-xs text-slate-500 ml-2">
                              ({account.warehouse_name})
                            </div>
                          )}
                        </div>
                        <span className="text-white">{formatCurrency(account.current_balance || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-600 pt-2 mt-4">
                <div className="flex justify-between font-medium text-blue-400">
                  <span>Total Equity</span>
                  <span>{formatCurrency(equityTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex justify-between font-bold text-white text-lg">
                <span>Total Liabilities & Equity</span>
                <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Balance Check */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="text-center">
            <div className={`text-lg font-semibold ${Math.abs(assetsTotal - totalLiabilitiesAndEquity) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
              Balance Check: {Math.abs(assetsTotal - totalLiabilitiesAndEquity) < 0.01 ? 'Balanced' : 'Not Balanced'}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Difference: {formatCurrency(Math.abs(assetsTotal - totalLiabilitiesAndEquity))}
            </div>
            {isInCorporateOverview && (
              <div className="text-xs text-slate-500 mt-2">
                Consolidated view across all warehouses
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
