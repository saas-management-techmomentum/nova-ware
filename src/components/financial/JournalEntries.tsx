
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Eye,
  CheckCircle,
  Clock,
  RotateCcw,
  Filter,
  Building,
  Warehouse
} from 'lucide-react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { AddJournalEntryDialog } from './AddJournalEntryDialog';
import { formatCurrency } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import DisabledWrapper from '@/components/inventory/DisabledWrapper';

export const JournalEntries = () => {
  const { journalEntries, isLoading, refetch, selectedWarehouse, isInCorporateOverview } = useJournalEntries();
  const { canViewAllWarehouses } = useWarehouse();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'draft': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'reversed': return <RotateCcw className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'reversed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const isAutomaticEntry = (entry: any) => {
    return entry.reference?.startsWith('Order Revenue:') || 
           entry.reference?.startsWith('Order:') ||
           entry.description?.includes('Revenue recognition') ||
           entry.entry_number?.includes('REV-');
  };

  const filteredEntries = journalEntries.filter((entry) => {
    switch (filterType) {
      case 'manual':
        return !isAutomaticEntry(entry);
      case 'automatic':
        return isAutomaticEntry(entry);
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Journal Entries</h2>
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
      {/* Corporate Overview Banner */}
      {isInCorporateOverview && (
        <Card className="bg-indigo-900/20 border-indigo-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-indigo-400" />
              <span className="text-indigo-300 font-medium">Corporate Overview</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Journal entries from all warehouses</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Journal Entries</h2>
          <p className="text-slate-400 mt-1">
            Double-entry bookkeeping transactions
            {isInCorporateOverview && " across all warehouses"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Filter entries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
                <SelectItem value="automatic">Automatic Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isInCorporateOverview && (
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          )}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400">
              {filterType === 'manual' && 'No manual journal entries found'}
              {filterType === 'automatic' && 'No automatic journal entries found'}
              {filterType === 'all' && 'No journal entries found'}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {filterType === 'automatic' 
                ? 'Complete some orders to see automatic entries'
                : 'Create your first journal entry to get started'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-mono text-slate-400">
                        {entry.entry_number}
                      </span>
                      <Badge className={getStatusColor(entry.status)}>
                        {getStatusIcon(entry.status)}
                        <span className="ml-1 capitalize">{entry.status}</span>
                      </Badge>
                      {isAutomaticEntry(entry) && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Auto-Generated
                        </Badge>
                      )}
                      {isInCorporateOverview && entry.warehouses && (
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                          <Warehouse className="h-3 w-3 mr-1" />
                          {entry.warehouses.name}
                        </Badge>
                      )}
                      {isInCorporateOverview && !entry.warehouse_id && (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                          <Warehouse className="h-3 w-3 mr-1" />
                          Unassigned
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium text-white mb-1">{entry.description}</div>
                    <div className="text-sm text-slate-400">
                      {new Date(entry.entry_date).toLocaleDateString()} • {entry.reference}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {formatCurrency(entry.total_amount || 0)}
                      </div>
                      <div className="text-xs text-slate-400">Total Amount</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                        className="h-8 w-8 p-0 hover:bg-slate-600"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {!isAutomaticEntry(entry) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-slate-600"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddJournalEntryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          refetch();
        }}
      />
    </div>
  );
};
