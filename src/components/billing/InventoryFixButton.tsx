
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface FixResult {
  invoice_id: string;
  product_name: string;
  sku: string;
  quantity_reduced: number;
  new_stock: number;
  action_taken: string;
}

export const InventoryFixButton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleFixExistingInvoices = async () => {
    setIsProcessing(true);
    setResults([]);
    setShowResults(false);

    try {
      console.log('Calling fix_existing_invoice_inventory function...');
      
      // Call the database function to fix existing invoices
      const { data, error } = await supabase.rpc('fix_existing_invoice_inventory');

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }

      const results = Array.isArray(data) ? data : [];
      setResults(results as any);
      setShowResults(true);

      if (results.length > 0) {
        toast({
          title: "Success",
          description: `Processed ${results.length} invoice items and reduced inventory accordingly`,
        });
      } else {
        toast({
          title: "No Changes Required",
          description: "All existing invoices have already been processed correctly",
        });
      }
    } catch (error) {
      console.error('Error fixing existing invoices:', error);
      toast({
        title: "Error",
        description: "Failed to process existing invoices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-orange-500/10 border-orange-500/20">
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center">
          <Wrench className="h-5 w-5 mr-2" />
          Fix Existing Invoices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-500/20 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-200">
            This will process all existing sent/approved/paid invoices that haven't had their inventory reduced yet. 
            It will also create missing orders based on client payment terms.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleFixExistingInvoices}
          disabled={isProcessing}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Existing Invoices...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Fix Existing Invoice Inventory
            </>
          )}
        </Button>

        {showResults && (
          <div className="space-y-4">
            {results.length > 0 ? (
              <>
                <Alert className="border-green-500/20 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    Successfully processed {results.length} invoice items:
                  </AlertDescription>
                </Alert>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="bg-slate-700/30 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-medium">{result.product_name}</span>
                          <span className="text-slate-400 ml-2">({result.sku})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400">-{result.quantity_reduced}</div>
                          <div className="text-slate-400 text-xs">Stock: {result.new_stock}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Invoice: {result.invoice_id} • {result.action_taken}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Alert className="border-gray-700/20 bg-gray-800/10">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-gray-200">
                  All existing invoices have already been processed correctly. No changes were needed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
