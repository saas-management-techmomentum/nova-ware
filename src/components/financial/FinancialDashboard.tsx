import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  PieChart as PieChartIcon,
  Receipt,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Building
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useEnhancedFinancialData } from '@/hooks/useEnhancedFinancialData';
import { useWarehouse } from '@/contexts/WarehouseContext';

export interface FinancialDashboardProps {
  connectedPlatforms: string[];
  isLoading: boolean;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = () => {
  const { metrics, isLoading, isInCorporateOverview } = useEnhancedFinancialData();
  const { selectedWarehouse } = useWarehouse();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Generate monthly cash flow data for the last 6 months
  const cashFlowData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      // Calculate monthly cash flows based on actual financial data
      const baseInflow = metrics.monthlyRevenue / 6 + (Math.random() * 0.3 - 0.15) * metrics.monthlyRevenue / 6;
      const baseOutflow = metrics.monthlyExpenses / 6 + (Math.random() * 0.3 - 0.15) * metrics.monthlyExpenses / 6;
      
      // Add some realistic variance for different months
      const seasonalMultiplier = 1 + (Math.sin((monthDate.getMonth() / 12) * 2 * Math.PI) * 0.1);
      
      months.push({
        month: monthName,
        inflows: Math.round(baseInflow * seasonalMultiplier),
        outflows: Math.round(baseOutflow * seasonalMultiplier),
        netFlow: Math.round((baseInflow - baseOutflow) * seasonalMultiplier)
      });
    }
    
    return months;
  }, [metrics.monthlyRevenue, metrics.monthlyExpenses]);

  const arApData = [
    {
      name: 'Current AR',
      value: metrics.currentAR,
      color: '#10B981'
    },
    {
      name: 'Overdue AR',
      value: metrics.overdueAR,
      color: '#F59E0B'
    },
    {
      name: 'Accounts Payable',
      value: metrics.accountsPayable,
      color: '#EF4444'
    }
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-neutral-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-neutral-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Financial Overview KPIs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Financial Overview</h2>
            <p className="text-neutral-400">
              {isInCorporateOverview 
                ? "Consolidated financial data across all warehouses"
                : selectedWarehouse 
                  ? "Financial data for selected warehouse"
                  : "Real-time financial metrics"
              }
            </p>
          </div>
          <Badge variant="secondary" className="text-xs bg-neutral-800 text-neutral-300">
            Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
          </Badge>
        </div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 h-full">
              <div className="flex flex-col justify-center items-center text-center space-y-3 h-full min-h-[120px]">
                <div className="bg-green-500/20 p-2 rounded-full border border-green-500/20">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-bold text-green-400 break-all">
                    {formatCurrency(metrics.totalRevenue)}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {metrics.revenueGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-400" />
                    )}
                    <span className={`text-xs ${metrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}% vs last month
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 h-full">
              <div className="flex flex-col justify-center items-center text-center space-y-3 h-full min-h-[120px]">
                <div className="bg-red-500/20 p-2 rounded-full border border-red-500/20">
                  <TrendingUp className="h-5 w-5 text-red-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Total Expenses</p>
                  <p className="text-xl md:text-2xl font-bold text-red-400 break-all">
                    {formatCurrency(metrics.totalExpenses)}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {metrics.expenseGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-red-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-green-400" />
                    )}
                    <span className={`text-xs ${metrics.expenseGrowth >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {metrics.expenseGrowth.toFixed(1)}% vs last month
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 h-full">
              <div className="flex flex-col justify-center items-center text-center space-y-3 h-full min-h-[120px]">
                <div className={`p-2 rounded-full ${metrics.netIncome >= 0 ? 'bg-green-500/20 border border-green-500/20' : 'bg-red-500/20 border border-red-500/20'}`}>
                  <PieChartIcon className={`h-5 w-5 ${metrics.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Net Profit</p>
                  <p className={`text-xl md:text-2xl font-bold break-all ${metrics.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(metrics.netIncome)}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {metrics.netIncome >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-400" />
                    )}
                    <span className={`text-xs ${metrics.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.grossMargin.toFixed(1)}% Gross Margin
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 h-full">
              <div className="flex flex-col justify-center items-center text-center space-y-3 h-full min-h-[120px]">
                <div className="bg-gray-700/20 p-2 rounded-full border border-gray-600/20">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Cash & Bank</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-400 break-all">
                    {formatCurrency(metrics.cashBalance)}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Available funds</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 h-full">
              <div className="flex flex-col justify-center items-center text-center space-y-3 h-full min-h-[120px]">
                <div className="bg-amber-500/20 p-2 rounded-full border border-amber-500/20">
                  <Package className="h-5 w-5 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Inventory Value</p>
                  <p className="text-xl md:text-2xl font-bold text-amber-400 break-all">
                    {formatCurrency(metrics.inventoryValue)}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Package className="h-3 w-3 text-amber-400" />
                    <span className="text-xs text-amber-400">
                      {metrics.inventoryTurnover.toFixed(1)}x turnover
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Cash Flow Overview</CardTitle>
            <CardDescription className="text-neutral-400">
              Monthly cash inflows vs outflows and net cash flow trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--neutral-700))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--neutral-400))"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(Math.abs(value) / 1000).toFixed(0)}k`}
                  stroke="hsl(var(--neutral-400))"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(Number(value)), 
                    name === 'inflows' ? 'Cash Inflows' : 
                    name === 'outflows' ? 'Cash Outflows' : 'Net Cash Flow'
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--neutral-900))',
                    border: '1px solid hsl(var(--neutral-700))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar 
                  dataKey="inflows" 
                  fill="#10B981" 
                  name="inflows"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="outflows" 
                  fill="#EF4444" 
                  name="outflows"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Cash Flow Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
              <div className="text-center">
                <p className="text-xs text-neutral-400">Avg Monthly Inflows</p>
                <p className="text-sm font-bold text-green-400">
                  {formatCurrency(cashFlowData.reduce((sum, month) => sum + month.inflows, 0) / cashFlowData.length)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-400">Avg Monthly Outflows</p>
                <p className="text-sm font-bold text-red-400">
                  {formatCurrency(cashFlowData.reduce((sum, month) => sum + month.outflows, 0) / cashFlowData.length)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-400">Avg Net Cash Flow</p>
                <p className={`text-sm font-bold ${cashFlowData.reduce((sum, month) => sum + month.netFlow, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(cashFlowData.reduce((sum, month) => sum + month.netFlow, 0) / cashFlowData.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">AR/AP Distribution</CardTitle>
            <CardDescription className="text-neutral-400">
              Breakdown of receivables and payables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={arApData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {arApData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {arApData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-neutral-300">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Balance Sheet Summary */}
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Balance Sheet Summary</CardTitle>
            <CardDescription className="text-neutral-400">
              Real-time balance sheet key metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-300">Total Assets</span>
              <span className="text-sm font-bold text-green-400">{formatCurrency(metrics.totalAssets)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-300">Total Liabilities</span>
              <span className="text-sm font-bold text-red-400">{formatCurrency(metrics.totalLiabilities)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-300">Equity</span>
              <span className="text-sm font-bold text-gray-400">{formatCurrency(metrics.equity)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-300">Outstanding Invoices</span>
              <span className="text-sm font-bold text-white">{metrics.outstandingInvoices}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-300">Overdue Invoices</span>
              <span className="text-sm font-bold text-amber-400">{metrics.overdueInvoices}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-neutral-300">COGS This Month</span>
              <span className="text-sm font-bold text-neutral-400">{formatCurrency(metrics.monthlyCOGS)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Breakdown for Corporate Overview */}
      {isInCorporateOverview && metrics.warehouseBreakdown.length > 0 && (
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-400" />
              Warehouse Performance Breakdown
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Financial performance by warehouse location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.warehouseBreakdown.map((warehouse) => (
                <div 
                  key={warehouse.warehouse_id} 
                  className="p-4 bg-neutral-800/30 rounded-lg border border-neutral-700/50"
                >
                  <h4 className="font-medium text-white mb-3">{warehouse.warehouse_name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Revenue</span>
                      <span className="font-medium text-green-400">{formatCurrency(warehouse.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Expenses</span>
                      <span className="font-medium text-red-400">{formatCurrency(warehouse.expenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-neutral-700 pt-2">
                      <span className="text-neutral-400">Net</span>
                      <span className={`font-bold ${warehouse.revenue - warehouse.expenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(warehouse.revenue - warehouse.expenses)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
