
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package, FileText, CheckCircle, CreditCard } from 'lucide-react';

export const InvoiceStatusWorkflow = () => {
  const statusSteps = [
    {
      status: 'draft',
      label: 'Draft',
      color: 'bg-gray-500',
      icon: FileText,
      description: 'Invoice created, no inventory impact'
    },
    {
      status: 'sent',
      label: 'Sent',
      color: 'bg-purple-500',
      icon: Package,
      description: 'Inventory reduced, invoice sent to client'
    },
    {
      status: 'approved',
      label: 'Approved',
      color: 'bg-blue-500',
      icon: CheckCircle,
      description: 'Order created for Net Terms clients'
    },
    {
      status: 'paid',
      label: 'Paid',
      color: 'bg-green-500',
      icon: CreditCard,
      description: 'Order created for immediate payment clients'
    }
  ];

  return (
    <Card className="bg-slate-800/30 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white text-sm">Invoice Status Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {statusSteps.map((step, index) => (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center min-w-fit">
                <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center mb-2`}>
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="text-xs mb-1 border-slate-600">
                  {step.label}
                </Badge>
                <div className="text-xs text-slate-400 text-center max-w-24">
                  {step.description}
                </div>
              </div>
              {index < statusSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
          <div className="text-xs text-slate-300 space-y-1">
            <div>• <span className="text-purple-400">Sent:</span> Inventory automatically reduced</div>
            <div>• <span className="text-blue-400">Approved:</span> Order created for clients with Net Terms</div>
            <div>• <span className="text-green-400">Paid:</span> Order created for immediate payment clients</div>
            <div>• <span className="text-red-400">Cancelled:</span> Inventory restored if previously reduced</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
