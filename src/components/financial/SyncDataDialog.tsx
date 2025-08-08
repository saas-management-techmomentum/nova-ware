
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Download, Upload, Users, FileText, Package, DollarSign } from 'lucide-react';
import integrationService, { ServiceType } from '@/services/integrationService';
import { useClients } from '@/hooks/useClients';
import { useBilling } from '@/hooks/useBilling';

interface SyncDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: ServiceType | null;
  serviceName: string;
}

type SyncDirection = 'import' | 'export';
type OptionDirection = 'both' | 'export' | 'import';

const syncOptions: Array<{
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  direction: OptionDirection;
}> = [
  {
    id: 'customers',
    label: 'Customers/Clients',
    description: 'Sync client information and contact details',
    icon: Users,
    direction: 'both'
  },
  {
    id: 'invoices',
    label: 'Invoices',
    description: 'Sync invoice data and payment status',
    icon: FileText,
    direction: 'both'
  },
  {
    id: 'products',
    label: 'Products',
    description: 'Sync inventory items and pricing',
    icon: Package,
    direction: 'export'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Sync financial transactions and payments',
    icon: DollarSign,
    direction: 'export'
  }
];

export const SyncDataDialog: React.FC<SyncDataDialogProps> = ({
  open,
  onOpenChange,
  serviceType,
  serviceName
}) => {
  const { toast } = useToast();
  const { clients } = useClients();
  const { invoices } = useBilling();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('export');
  const [isLoading, setIsLoading] = useState(false);

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSync = async () => {
    if (!serviceType || selectedOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one sync option",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      for (const option of selectedOptions) {
        let data: any[] = [];
        
        // Prepare data based on sync type
        switch (option) {
          case 'customers':
            data = clients.map(client => ({
              id: client.id,
              name: client.name,
              email: client.contactEmail,
              phone: client.contactPhone,
              address: client.shippingAddress
            }));
            break;
          case 'invoices':
            data = invoices.map(invoice => ({
              id: invoice.id,
              number: invoice.invoice_number,
              date: invoice.invoice_date,
              amount: invoice.total_amount,
              status: invoice.status
            }));
            break;
          case 'products':
            // This would be populated from inventory context if available
            data = [];
            break;
          case 'transactions':
            // This would be populated from billing transactions
            data = [];
            break;
        }

        await integrationService.syncData(
          serviceType, 
          option as any, 
          data
        );
      }

      toast({
        title: "Sync Completed",
        description: `Successfully synced ${selectedOptions.length} data type(s) with ${serviceName}`,
      });

      onOpenChange(false);
      setSelectedOptions([]);
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: `Failed to sync data with ${serviceName}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDataCount = (optionId: string) => {
    switch (optionId) {
      case 'customers': return clients.length;
      case 'invoices': return invoices.length;
      case 'products': return 0; // Would be from inventory
      case 'transactions': return 0; // Would be from billing transactions
      default: return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Sync Data with {serviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sync Direction */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-300">Sync Direction</h3>
            <div className="flex gap-4">
              <Button
                variant={syncDirection === 'export' ? 'default' : 'outline'}
                onClick={() => setSyncDirection('export')}
                className={syncDirection === 'export' ? 'bg-indigo-600' : 'border-slate-600'}
              >
                <Upload className="h-4 w-4 mr-2" />
                Export to {serviceName}
              </Button>
              <Button
                variant={syncDirection === 'import' ? 'default' : 'outline'}
                onClick={() => setSyncDirection('import')}
                className={syncDirection === 'import' ? 'bg-indigo-600' : 'border-slate-600'}
              >
                <Download className="h-4 w-4 mr-2" />
                Import from {serviceName}
              </Button>
            </div>
          </div>

          {/* Sync Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-300">Data to Sync</h3>
            <div className="space-y-3">
              {syncOptions.map((option) => {
                const Icon = option.icon;
                const dataCount = getDataCount(option.id);
                
                // Check if option is available for the selected sync direction
                const isAvailable = option.direction === 'both' || 
                  option.direction === syncDirection;

                return (
                  <div
                    key={option.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg ${
                      isAvailable ? 'border-slate-600 hover:border-slate-500' : 'border-slate-700 opacity-50'
                    }`}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionToggle(option.id)}
                      disabled={!isAvailable}
                    />
                    <Icon className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label 
                          htmlFor={option.id} 
                          className="font-medium text-white cursor-pointer"
                        >
                          {option.label}
                        </label>
                        {syncDirection === 'export' && dataCount > 0 && (
                          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                            {dataCount} records
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSync}
              disabled={isLoading || selectedOptions.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Sync
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
