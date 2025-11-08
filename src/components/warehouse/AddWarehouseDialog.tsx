
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import { useWarehouseCreation, WarehouseFormData } from '@/hooks/useWarehouseCreation';
import WarehouseForm from './WarehouseForm';

interface AddWarehouseDialogProps {
  onWarehouseAdded?: () => void;
}

const AddWarehouseDialog: React.FC<AddWarehouseDialogProps> = ({ onWarehouseAdded }) => {
  const [open, setOpen] = useState(false);
  const { createWarehouse, isLoading, isAdmin } = useWarehouseCreation();

  const form = useForm<WarehouseFormData>({
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: ''
    }
  });

  const onSubmit = async (data: WarehouseFormData) => {
    const success = await createWarehouse(data);
    if (success) {
      form.reset();
      setOpen(false);
      if (onWarehouseAdded) {
        onWarehouseAdded();
      }
    }
  };

  // Only show the dialog to admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 px-3 py-2 rounded-md border border-amber-400/20">
          <AlertCircle className="h-4 w-4" />
          <span>Admin access required to create warehouses</span>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            Add New Warehouse
          </DialogTitle>
        </DialogHeader>
        
        <WarehouseForm
          form={form}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddWarehouseDialog;
