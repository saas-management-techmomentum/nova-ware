import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Package2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface WorkflowShipmentIntegrationProps {
  orderId: string;
  orderStatus: string;
  className?: string;
}

export const WorkflowShipmentIntegration: React.FC<WorkflowShipmentIntegrationProps> = ({
  orderId,
  orderStatus,
  className
}) => {
  const navigate = useNavigate();

  // Only show integration card when order is ready to ship or shipped
  if (!['order-ready', 'order-shipped'].includes(orderStatus)) {
    return null;
  }

  const handleViewOutgoingShipments = () => {
    navigate('/app/shipments?tab=outgoing');
  };

  return (
    <Card className={`bg-green-50/50 border-green-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Package2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-green-800">
                  Outgoing Shipment
                </span>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {orderStatus === 'order-ready' ? 'Created' : 'Shipped'}
                </Badge>
              </div>
              <p className="text-sm text-green-600">
                Order {orderId} has been automatically transferred to Outgoing Shipments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-green-500" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOutgoingShipments}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Shipments
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};