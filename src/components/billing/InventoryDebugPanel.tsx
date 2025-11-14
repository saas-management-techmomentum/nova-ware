
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Bug, CheckCircle, XCircle } from 'lucide-react';

interface InventoryDebugPanelProps {
  invoiceId: string;
  onClose: () => void;
}

export const InventoryDebugPanel: React.FC<InventoryDebugPanelProps> = ({ invoiceId, onClose }) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const { toast } = useToast();

  const debugInventoryReduction = async () => {
    setIsDebugging(false);
    try {
      toast({
        title: "Feature Unavailable",
        description: "This debug function requires database functions that haven't been created yet.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Error",
        description: "Failed to run debug function",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Bug className="h-5 w-5 mr-2 text-orange-400" />
          Inventory Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300">Debug inventory reduction for invoice:</p>
            <p className="text-xs text-slate-400 mb-1">Enter invoice number (e.g., INV-409991131) or database ID</p>
            <code className="text-sm bg-slate-700 px-2 py-1 rounded text-green-400">{invoiceId}</code>
          </div>
          <Button
            onClick={debugInventoryReduction}
            disabled={isDebugging}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isDebugging ? 'Debugging...' : 'Run Debug'}
          </Button>
        </div>

        {debugResults && (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Debug Results:</h4>
            
            {/* Summary Card */}
            <div className="bg-slate-700/50 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Execution Summary</span>
                <Badge variant={debugResults.success ? 'default' : 'destructive'}>
                  {debugResults.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="text-sm text-slate-400 space-y-1">
                <p>Status: {debugResults.message}</p>
                <p>Invoice: {debugResults.invoice_number || debugResults.invoice_id}</p>
                <p>Mode: {debugResults.execution_mode}</p>
                <p>Items Processed: {debugResults.successful_items || 0}/{debugResults.total_items_processed || 0}</p>
                {debugResults.failed_items > 0 && (
                  <p className="text-red-400">Failed Items: {debugResults.failed_items}</p>
                )}
              </div>
            </div>

            {/* Processing Results */}
            {debugResults.processing_results && debugResults.processing_results.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-white font-medium">Item Processing Details:</h5>
                {debugResults.processing_results.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-700/50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.name} ({item.sku})</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.success ? 'default' : 'destructive'}>
                          {item.success ? 'Success' : 'Failed'}
                        </Badge>
                        {item.new_stock !== undefined && (
                          <Badge variant="outline">
                            Stock: {item.new_stock}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      {item.success ? (
                        <>
                          <p>Previous Stock: {item.previous_stock}</p>
                          <p>Quantity Reduced: {item.quantity_reduced}</p>
                          <p>New Stock: {item.new_stock}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400">Error: {item.error}</p>
                          {item.previous_stock !== undefined && (
                            <p>Available Stock: {item.previous_stock}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      {item.success ? (
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Successfully processed</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-400">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">{item.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Insufficient Stock Items */}
            {debugResults.insufficient_stock_items && debugResults.insufficient_stock_items.length > 0 && (
              <div className="bg-red-900/20 border border-red-700 p-3 rounded">
                <h5 className="text-red-300 font-medium mb-2">Insufficient Stock Items:</h5>
                {debugResults.insufficient_stock_items.map((item: any, index: number) => (
                  <div key={index} className="text-sm text-red-300 mb-1">
                    {item.name} ({item.sku}): Available {item.available_stock}, Needed {item.requested_quantity}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-900/20 border border-yellow-700 p-3 rounded">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2 mt-0.5" />
            <div className="text-xs text-yellow-300">
              <p className="font-medium mb-1">Debug Information:</p>
              <p>• Check PostgreSQL logs for DEBUGGING messages</p>
              <p>• Verify product IDs match between invoice items and products table</p>
              <p>• Ensure warehouse_id consistency between invoice and products</p>
              <p>• Check for existing inventory_history entries that might prevent re-reduction</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-600">
            Close Debug Panel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
