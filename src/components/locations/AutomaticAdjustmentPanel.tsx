
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, Trash2, Settings } from 'lucide-react';
import { useAutomaticPalletAdjustments } from '@/hooks/useAutomaticPalletAdjustments';

const AutomaticAdjustmentPanel = () => {
  const { fulfillmentLogs, isProcessing, cleanupEmptyPallets } = useAutomaticPalletAdjustments();

  return (
    <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center text-white">
          <Settings className="h-5 w-5 mr-2 text-green-400" />
          Automatic Pallet Adjustments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Auto-Adjust</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Enabled for order fulfillment
            </p>
          </div>
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">FIFO</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              First In, First Out picking
            </p>
          </div>
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Real-time</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Instant pallet updates
            </p>
          </div>
        </div>

        <Separator className="bg-neutral-700" />

        {/* How It Works */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">How Automatic Adjustments Work:</h3>
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-neutral-700/30 border-neutral-700/50">1</Badge>
              <span>When an order status changes to "Order Ready" or "Order Shipped"</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-neutral-700/30 border-neutral-700/50">2</Badge>
              <span>System automatically identifies products on pallets using FIFO</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-neutral-700/30 border-neutral-700/50">3</Badge>
              <span>Pallet quantities are reduced based on order items</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-neutral-700/30 border-neutral-700/50">4</Badge>
              <span>Inventory history is logged for audit trail</span>
            </div>
          </div>
        </div>

        <Separator className="bg-neutral-700" />

        {/* Maintenance Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Maintenance:</h3>
          <Button
            variant="outline"
            onClick={cleanupEmptyPallets}
            disabled={isProcessing}
            className="w-full gap-2 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <Trash2 className="h-4 w-4" />
            {isProcessing ? 'Cleaning up...' : 'Remove Empty Pallets'}
          </Button>
          <p className="text-xs text-neutral-400">
            Remove pallet entries with zero quantities to keep the system clean
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomaticAdjustmentPanel;
