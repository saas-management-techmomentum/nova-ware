
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  FileText,
  Building,
  Warehouse
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';

export const RevenueRecognition: React.FC = () => {
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const { user } = useAuth();
  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  const { data: revenueEntries, isLoading } = useQuery({
    queryKey: ['revenueRecognition', selectedWarehouse],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            *,
            accounts (
              account_name,
              account_code
            )
          ),
          warehouses (
            name,
            code
          )
        `)
        .eq('user_id', user.id)
        .ilike('reference', 'Order Revenue:%')
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply warehouse filter if specific warehouse selected
      if (selectedWarehouse && !isInCorporateOverview) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 animate-pulse">
        <CardHeader>
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = revenueEntries?.reduce((sum, entry) => sum + entry.total_amount, 0) || 0;
  const completedOrders = revenueEntries?.length || 0;

  return (
    <div className="space-y-6">
      {/* Corporate Overview Banner */}
      {isInCorporateOverview && (
        <Card className="bg-indigo-900/20 border-indigo-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-indigo-400" />
              <span className="text-indigo-300 font-medium">Corporate Overview</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Revenue recognition across all warehouses</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  Total Revenue {isInCorporateOverview && "(All Warehouses)"}
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">
                  Completed Orders {isInCorporateOverview && "(All Warehouses)"}
                </p>
                <p className="text-xl font-bold text-blue-400">{completedOrders}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Package className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Order Value</p>
                <p className="text-xl font-bold text-purple-400">
                  {formatCurrency(completedOrders > 0 ? totalRevenue / completedOrders : 0)}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-400" />
            Revenue Recognition Entries
            {isInCorporateOverview && (
              <span className="ml-2 text-sm text-slate-400">(All Warehouses)</span>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Automatic journal entries created when orders are completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenueEntries && revenueEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-600">
                  <TableHead className="text-slate-300">Entry Number</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Order Reference</TableHead>
                  {isInCorporateOverview && (
                    <TableHead className="text-slate-300">Warehouse</TableHead>
                  )}
                  <TableHead className="text-slate-300 text-right">Amount</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-slate-600">
                    <TableCell className="text-slate-300 font-medium">
                      {entry.entry_number}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="text-sm">
                        {entry.reference?.replace('Order Revenue: ', '') || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-500">{entry.description}</div>
                    </TableCell>
                    {isInCorporateOverview && (
                      <TableCell className="text-slate-300">
                        <div className="flex items-center space-x-1">
                          <Warehouse className="h-3 w-3 text-slate-400" />
                          <span className="text-sm">
                            {entry.warehouses?.name || 'Unassigned'}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="font-semibold text-emerald-400">
                        {formatCurrency(entry.total_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          entry.status === 'posted' 
                            ? 'bg-emerald-900/30 text-emerald-300' 
                            : 'bg-slate-600/30 text-slate-400'
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No revenue recognition entries yet</p>
              <p className="text-sm text-slate-500 mt-1">
                {isInCorporateOverview 
                  ? "Entries will appear when orders are completed across warehouses"
                  : "Entries will appear when orders are completed"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
