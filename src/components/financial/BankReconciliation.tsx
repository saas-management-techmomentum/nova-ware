import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Clock } from 'lucide-react';

export const BankReconciliation = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Bank & Cash Management</h2>
      </div>

      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-neutral-800 p-6 mb-6">
            <Building2 className="h-12 w-12 text-neutral-400" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="text-2xl font-semibold text-foreground">Coming Soon</h3>
          </div>
          <p className="text-muted-foreground text-center max-w-md">
            Bank connections, transaction management, reconciliation, and petty cash features 
            are currently under development. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
