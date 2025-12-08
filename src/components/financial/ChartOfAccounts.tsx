
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  DollarSign,
  Building,
  CreditCard,
  TrendingUp,
  Receipt,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useWarehouseScopedAccounts } from '@/hooks/useWarehouseScopedAccounts';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { AddAccountDialog } from './AddAccountDialog';
import { EditAccountDialog } from './EditAccountDialog';
import { formatCurrency } from '@/lib/utils';
import DisabledWrapper from '@/components/inventory/DisabledWrapper';
import { supabase } from '@/integrations/supabase/client';

interface AccountTransaction {
  id: string;
  entry_date: string;
  description: string;
  reference?: string;
  debit_amount: number;
  credit_amount: number;
  entry_number: string;
}

const ChartOfAccounts = () => {
  const { accounts, accountTypes, isLoading, refetch, deleteAccount, selectedWarehouse } = useWarehouseScopedAccounts();
  const { canViewAllWarehouses } = useWarehouse();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['assets', 'liabilities', 'equity', 'revenue', 'expenses']));
  const [viewingAccountTransactions, setViewingAccountTransactions] = useState<any>(null);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  // Set up real-time subscriptions for account balance updates
  useEffect(() => {
    const journalEntriesChannel = supabase
      .channel('account-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entry_lines'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(journalEntriesChannel);
    };
  }, [refetch]);

  // Fetch account transaction history
  const fetchAccountTransactions = async (accountId: string) => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          id,
          debit_amount,
          credit_amount,
          description,
          journal_entries!inner(
            id,
            entry_number,
            entry_date,
            description,
            reference,
            user_id,
            warehouse_id
          )
        `)
        .eq('account_id', accountId)
        .order('journal_entries(entry_date)', { ascending: false });

      if (error) throw error;

      const transactions: AccountTransaction[] = data?.map((line: any) => ({
        id: line.id,
        entry_date: line.journal_entries.entry_date,
        description: line.description || line.journal_entries.description,
        reference: line.journal_entries.reference,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        entry_number: line.journal_entries.entry_number
      })) || [];

      setAccountTransactions(transactions);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleViewTransactions = (account: any) => {
    setViewingAccountTransactions(account);
    fetchAccountTransactions(account.id);
  };

  const handleDeleteAccount = async (account: any) => {
    if (confirm(`Are you sure you want to delete the account "${account.account_name}"? This action cannot be undone.`)) {
      try {
        await deleteAccount(account.id);
      } catch (error) {
        // Error is already handled in the hook
      }
    }
  };

  // Only show blocking message if not in corporate overview and no warehouse selected
  if (!selectedWarehouse && !canViewAllWarehouses) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Chart of Accounts</h2>
            <p className="text-neutral-400 mt-1">Manage your account structure and balances</p>
          </div>
        </div>
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Warehouse Selected</h3>
            <p className="text-neutral-400">Please select a warehouse to view and manage your chart of accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assets': return <Building className="h-4 w-4" />;
      case 'liabilities': return <CreditCard className="h-4 w-4" />;
      case 'equity': return <DollarSign className="h-4 w-4" />;
      case 'revenue': return <TrendingUp className="h-4 w-4" />;
      case 'expenses': return <Receipt className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assets': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'liabilities': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'equity': return 'bg-gray-700/10 text-gray-400 border-gray-600/20';
      case 'revenue': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'expenses': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const groupedAccounts = accountTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    const typeAccounts = accounts.filter(account => account.account_type_id === type.id);
    if (typeAccounts.length > 0) {
      acc[type.category].push({ type, accounts: typeAccounts });
    }
    return acc;
  }, {} as Record<string, Array<{ type: any; accounts: any[] }>>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Chart of Accounts</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-neutral-700 rounded w-3/4"></div>
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
          <h2 className="text-2xl font-bold text-white">Chart of Accounts</h2>
          <p className="text-neutral-400 mt-1">
            {isInCorporateOverview 
              ? "Viewing consolidated accounts from all warehouses"
              : "Manage your account structure and balances for the selected warehouse"
            }
          </p>
        </div>
        {!isInCorporateOverview && (
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-white text-black hover:bg-neutral-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        )}
      </div>

      {accounts.length === 0 && !isLoading ? (
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-8 text-center">
            <DollarSign className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Accounts Available</h3>
            <p className="text-neutral-400 mb-6">
              Start by creating your first account to build your chart of accounts.
            </p>
            {!isInCorporateOverview && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-white text-black hover:bg-neutral-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Account
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAccounts).map(([category, categoryData]) => (
          <Card key={category} className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-neutral-800/30 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {expandedCategories.has(category) ? 
                    <ChevronDown className="h-4 w-4 text-neutral-400" /> : 
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  }
                  {getCategoryIcon(category)}
                  <CardTitle className="text-lg capitalize text-white">
                    {category}
                  </CardTitle>
                  <Badge className={getCategoryColor(category)}>
                    {categoryData.reduce((sum, data) => sum + data.accounts.length, 0)} accounts
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(
                      categoryData.reduce((sum, data) => 
                        sum + data.accounts.reduce((accSum, acc) => accSum + (acc.current_balance || 0), 0), 0
                      )
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">Total Balance</div>
                </div>
              </div>
            </CardHeader>
            
            {expandedCategories.has(category) && (
              <CardContent className="pt-0">
                {categoryData.map(({ type, accounts: typeAccounts }) => (
                  <div key={type.id} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-medium text-neutral-300 mb-2 px-4">
                      {type.name}
                    </h4>
                    <div className="space-y-2">
                      {typeAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30 hover:bg-neutral-800/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-mono text-neutral-500 min-w-[60px]">
                                {account.account_code}
                              </span>
                              <div>
                                <div className="font-medium text-white">{account.account_name}</div>
                                {account.description && (
                                  <div className="text-sm text-neutral-400">{account.description}</div>
                                )}
                                {isInCorporateOverview && account.warehouse_name && (
                                  <div className="text-xs text-neutral-500 mt-1">
                                    Warehouse: {account.warehouse_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {formatCurrency(account.current_balance || 0)}
                              </div>
                              <div className="text-xs text-neutral-400">Current Balance</div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTransactions(account)}
                                className="h-8 w-8 p-0 hover:bg-neutral-700/50 text-neutral-400"
                                title="View Transaction History"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <DisabledWrapper
                                disabled={isInCorporateOverview}
                                tooltipContent="Select a specific warehouse to edit accounts"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingAccount(account)}
                                  className="h-8 w-8 p-0 hover:bg-neutral-700/50"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DisabledWrapper>
                              <DisabledWrapper
                                disabled={isInCorporateOverview}
                                tooltipContent="Select a specific warehouse to delete accounts"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAccount(account)}
                                  className="h-8 w-8 p-0 hover:bg-red-600/20 text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </DisabledWrapper>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
          ))}
        </div>
      )}

      <AddAccountDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          refetch();
        }}
        accountTypes={accountTypes}
      />

      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
          onSuccess={() => {
            setEditingAccount(null);
            refetch();
          }}
          accountTypes={accountTypes}
        />
      )}

      {/* Account Transaction History Dialog */}
      <Dialog 
        open={!!viewingAccountTransactions} 
        onOpenChange={(open) => !open && setViewingAccountTransactions(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Transaction History: {viewingAccountTransactions?.account_name}
            </DialogTitle>
            <p className="text-neutral-400">
              Account Code: {viewingAccountTransactions?.account_code} | 
              Current Balance: {formatCurrency(viewingAccountTransactions?.current_balance || 0)}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingTransactions ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-400">Loading transactions...</p>
              </div>
            ) : accountTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Transactions Found</h3>
                <p className="text-neutral-400">This account has no transaction history yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800">
                    <TableHead className="text-neutral-300">Date</TableHead>
                    <TableHead className="text-neutral-300">Entry #</TableHead>
                    <TableHead className="text-neutral-300">Description</TableHead>
                    <TableHead className="text-right text-neutral-300">Debit</TableHead>
                    <TableHead className="text-right text-neutral-300">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-neutral-800 hover:bg-neutral-800/30">
                      <TableCell className="text-neutral-300">
                        {new Date(transaction.entry_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-neutral-400 font-mono">
                        {transaction.entry_number}
                      </TableCell>
                      <TableCell className="text-white">
                        {transaction.description}
                        {transaction.reference && (
                          <span className="text-neutral-500 text-sm block">{transaction.reference}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.debit_amount > 0 ? (
                          <span className="text-green-400">{formatCurrency(transaction.debit_amount)}</span>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.credit_amount > 0 ? (
                          <span className="text-red-400">{formatCurrency(transaction.credit_amount)}</span>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChartOfAccounts;
