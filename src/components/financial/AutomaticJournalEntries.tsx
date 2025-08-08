
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
  FileText, 
  Truck,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JournalEntry {
  id: string;
  entry_number: string;
  description: string;
  entry_date: string;
  total_amount: number;
  journal_entry_lines?: {
    id: string;
    account_id: string;
    debit_amount: number;
    credit_amount: number;
    description: string;
    accounts: {
      account_name: string;
      account_code: string;
    } | null;
  }[];
}

export const AutomaticJournalEntries: React.FC = () => {
  const { data: automaticEntries, isLoading } = useQuery({
    queryKey: ['automaticJournalEntries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            id,
            account_id,
            debit_amount,
            credit_amount,
            description,
            accounts (
              account_name,
              account_code
            )
          )
        `)
        .ilike('reference', 'Order:%')
        .eq('status', 'posted' as any)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Type guard and cast the data
      const entries: JournalEntry[] = (data || [])
        .filter((item: any) => item && typeof item === 'object' && 'id' in item)
        .map((entry: any) => ({
          id: entry.id,
          entry_number: entry.entry_number || '',
          description: entry.description || '',
          entry_date: entry.entry_date || '',
          total_amount: entry.total_amount || 0,
          journal_entry_lines: entry.journal_entry_lines || []
        }));
      
      return entries;
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

  return (
    <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Truck className="h-5 w-5 mr-2 text-emerald-400" />
          Automatic Journal Entries
        </CardTitle>
        <CardDescription className="text-slate-400">
          Journal entries automatically created from order completions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {automaticEntries && automaticEntries.length > 0 ? (
          <div className="space-y-4">
            {automaticEntries.map((entry) => (
              <div
                key={entry.id}
                className="border border-slate-700 rounded-lg p-4 bg-slate-700/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span className="font-medium text-white">{entry.entry_number}</span>
                      <Badge variant="secondary" className="bg-emerald-900/30 text-emerald-300">
                        Auto-Generated
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{entry.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-emerald-400">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-bold">{formatCurrency(entry.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {entry.journal_entry_lines && entry.journal_entry_lines.length > 0 && (
                  <div className="mt-3">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-600">
                          <TableHead className="text-slate-300 text-xs">Account</TableHead>
                          <TableHead className="text-slate-300 text-xs text-right">Debit</TableHead>
                          <TableHead className="text-slate-300 text-xs text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.journal_entry_lines.map((line) => (
                          <TableRow key={line.id} className="border-slate-600">
                            <TableCell className="text-slate-300 text-sm">
                              <div>
                                <span className="font-medium">
                                  {line.accounts?.account_name || 'Unknown Account'}
                                </span>
                                <span className="text-slate-500 ml-2">
                                  ({line.accounts?.account_code || 'N/A'})
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {line.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {line.debit_amount && line.debit_amount > 0 ? (
                                <span className="text-rose-300">
                                  {formatCurrency(line.debit_amount)}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {line.credit_amount && line.credit_amount > 0 ? (
                                <span className="text-emerald-300">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No automatic journal entries yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Complete some orders to see automatic financial entries
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

