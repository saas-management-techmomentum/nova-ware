import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import AddWarehouseDialog from './AddWarehouseDialog';
import { useAuth } from '@/contexts/AuthContext';

const WarehouseEmptyState: React.FC = () => {
  const { isUserAdmin } = useAuth();

  if (!isUserAdmin) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Create Your First Warehouse</CardTitle>
            <CardDescription>
              Get started by creating a warehouse location for your inventory
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AddWarehouseDialog />
      </CardContent>
    </Card>
  );
};

export default WarehouseEmptyState;
