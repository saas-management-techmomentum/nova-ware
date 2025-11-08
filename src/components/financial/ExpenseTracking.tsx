
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Receipt, 
  Car, 
  Home, 
  Utensils, 
  Briefcase,
  ShoppingCart,
  Building
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useWarehouseScopedExpenses } from '@/hooks/useWarehouseScopedExpenses';
import DisabledWrapper from '@/components/inventory/DisabledWrapper';

export const ExpenseTracking = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { canViewAllWarehouses, selectedWarehouse } = useWarehouse();
  const { expenses, totalExpenses, pendingExpenses, expensesByCategory, isLoading } = useWarehouseScopedExpenses();

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  // Only show blocking message if not in corporate overview and no warehouse selected
  if (!selectedWarehouse && !canViewAllWarehouses) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Expense Tracking</h2>
            <p className="text-slate-400 mt-1">Track and categorize business expenses</p>
          </div>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Warehouse Selected</h3>
            <p className="text-slate-400">Please select a warehouse to view expense tracking.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'travel': return <Car className="h-4 w-4" />;
      case 'utilities': return <Home className="h-4 w-4" />;
      case 'meals & entertainment': return <Utensils className="h-4 w-4" />;
      case 'equipment': return <Briefcase className="h-4 w-4" />;
      case 'office supplies': return <ShoppingCart className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Expense Tracking</h2>
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
          <h2 className="text-2xl font-bold text-white">Expense Tracking</h2>
          <p className="text-slate-400 mt-1">
            {isInCorporateOverview 
              ? "Track and categorize business expenses (Consolidated across all warehouses)"
              : "Track and categorize business expenses"
            }
          </p>
        </div>
        {!isInCorporateOverview && (
          <Button className="bg-gray-800 hover:bg-gray-900">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg">
                <Receipt className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(pendingExpenses)}</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <Receipt className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">{Object.keys(expensesByCategory).length}</p>
              </div>
              <div className="bg-gray-700/10 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(expensesByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <span className="text-white font-medium">{category}</span>
                    {isInCorporateOverview && (
                      <Badge className="bg-slate-600/30 text-slate-300">
                        All Warehouses
                      </Badge>
                    )}
                  </div>
                  <span className="text-red-400 font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Receipt className="h-12 w-12 mb-3 text-slate-500" />
              <p className="text-sm">No expense categories available</p>
              <p className="text-xs text-slate-500 mt-1">Add expenses to see category breakdown</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(expense.category)}
                    <div>
                      <span className="text-white font-medium">{expense.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-400 text-sm">{expense.date}</span>
                        {isInCorporateOverview && expense.warehouse_name && (
                          <Badge className="bg-slate-600/30 text-slate-300 text-xs">
                            {expense.warehouse_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(expense.status)}>
                      {expense.status}
                    </Badge>
                    <span className="text-red-400 font-semibold">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Receipt className="h-12 w-12 mb-3 text-slate-500" />
              <p className="text-sm">No expenses recorded</p>
              <p className="text-xs text-slate-500 mt-1">Start tracking expenses to see them here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isInCorporateOverview && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-slate-400">
              This is a consolidated view of expenses across all warehouses in your organization
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
