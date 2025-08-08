
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { History, Calendar, User, Package, ArrowRight, ArrowLeft, AlertTriangle, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface InventoryHistoryEntry {
  id: string;
  transaction_type: 'incoming' | 'outgoing' | 'adjustment' | 'damaged';
  quantity: number;
  remaining_stock: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  client_name?: string;
}

interface InventoryHistoryDropdownProps {
  productId: string;
  productName: string;
}

const InventoryHistoryDropdown: React.FC<InventoryHistoryDropdownProps> = ({
  productId,
  productName,
}) => {
  const [history, setHistory] = useState<InventoryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const fetchHistory = async () => {
    if (!user || !isOpen) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_history')
        .select(`
          id,
          transaction_type,
          quantity,
          remaining_stock,
          reference,
          notes,
          created_at,
          clients (
            name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const transformedData: InventoryHistoryEntry[] = data?.map(item => ({
        id: item.id,
        transaction_type: item.transaction_type as 'incoming' | 'outgoing' | 'adjustment' | 'damaged',
        quantity: item.quantity,
        remaining_stock: item.remaining_stock,
        reference: item.reference,
        notes: item.notes,
        created_at: item.created_at,
        client_name: (item.clients as any)?.name || null
      })) || [];

      setHistory(transformedData);
    } catch (error) {
      console.error('Error fetching inventory history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, productId, user]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <ArrowRight className="h-3 w-3 text-emerald-500" />;
      case 'outgoing':
        return <ArrowLeft className="h-3 w-3 text-rose-500" />;
      case 'adjustment':
        return <Settings className="h-3 w-3 text-amber-500" />;
      case 'damaged':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      default:
        return <Package className="h-3 w-3 text-slate-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'bg-emerald-500/90 text-white';
      case 'outgoing':
        return 'bg-rose-500/90 text-white';
      case 'adjustment':
        return 'bg-amber-500/90 text-white';
      case 'damaged':
        return 'bg-orange-500/90 text-white';
      default:
        return 'bg-slate-500/90 text-white';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-slate-600/50"
        >
          <History className="h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-96 bg-slate-800 border-slate-700 text-white"
      >
        <div className="p-3">
          <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-400" />
            Inventory History - {productName}
          </h4>
          
          {loading ? (
            <div className="text-center py-4 text-slate-400">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-slate-400">
              No history available
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {history.map((entry, index) => (
                  <div key={entry.id}>
                    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-700/50 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getTransactionIcon(entry.transaction_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge 
                            className={`text-xs px-2 py-0.5 ${getTransactionColor(entry.transaction_type)}`}
                          >
                            {formatTransactionType(entry.transaction_type)}
                          </Badge>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">
                            {entry.transaction_type === 'outgoing' ? '-' : '+'}{entry.quantity} units
                          </span>
                          <span className="text-slate-400 text-xs">
                            Stock: {entry.remaining_stock}
                          </span>
                        </div>
                        
                        {entry.client_name && (
                          <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-300">{entry.client_name}</span>
                          </div>
                        )}
                        
                        {entry.reference && (
                          <div className="text-xs text-slate-400 mt-1">
                            Ref: {entry.reference}
                          </div>
                        )}
                        
                        {entry.notes && (
                          <div className="text-xs text-slate-400 mt-1">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < history.length - 1 && (
                      <Separator className="my-1 bg-slate-700" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InventoryHistoryDropdown;
