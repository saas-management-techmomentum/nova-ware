import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, Wallet } from 'lucide-react';
import { useBankCashManagement } from '@/hooks/useBankCashManagement';

export const BankDashboard = () => {
  const { dashboardMetrics, isLoading } = useBankCashManagement();

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-20 bg-muted rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Bank Balance */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Bank Balance
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(dashboardMetrics.totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all bank accounts
          </p>
        </CardContent>
      </Card>

      {/* Monthly Incoming */}
      <Card className="border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Incoming
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(dashboardMetrics.monthlyIncoming)}
          </div>
          <p className="text-xs text-muted-foreground">
            Deposits this month
          </p>
        </CardContent>
      </Card>

      {/* Monthly Outgoing */}
      <Card className="border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Outgoing
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(dashboardMetrics.monthlyOutgoing)}
          </div>
          <p className="text-xs text-muted-foreground">
            Payments this month
          </p>
        </CardContent>
      </Card>

      {/* Unmatched Transactions */}
      <Card className="border-yellow-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Reconciliation Status
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {dashboardMetrics.unmatchedTransactions}
          </div>
          <p className="text-xs text-muted-foreground">
            Unmatched transactions
          </p>
          {dashboardMetrics.unmatchedTransactions > 0 && (
            <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-200">
              Requires Attention
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Petty Cash Balance */}
      <Card className="border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Petty Cash Balance
          </CardTitle>
          <Wallet className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(dashboardMetrics.pettyCashBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Available cash on hand
          </p>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card className="border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Upcoming Payments
          </CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(dashboardMetrics.upcomingPayments)}
          </div>
          <p className="text-xs text-muted-foreground">
            Due within 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};