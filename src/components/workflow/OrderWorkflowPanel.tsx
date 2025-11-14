import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface OrderWorkflowPanelProps {
  orderId: string;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

// Workflow features are disabled - missing database tables
const OrderWorkflowPanel: React.FC<OrderWorkflowPanelProps> = () => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Order Workflow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-400 text-sm">
          Workflow features are currently unavailable. Please use the standard order status controls.
        </p>
      </CardContent>
    </Card>
  );
};

export default OrderWorkflowPanel;
