
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWarehouseScopedAccounts } from '@/hooks/useWarehouseScopedAccounts';

interface AccountType {
  id: string;
  name: string;
  category: string;
}

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accountTypes: AccountType[];
}

export const AddAccountDialog = ({ open, onOpenChange, onSuccess, accountTypes }: AddAccountDialogProps) => {
  const { createAccount } = useWarehouseScopedAccounts();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type_id: '',
    description: '',
    opening_balance: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_code || !formData.account_name || !formData.account_type_id) {
      return;
    }

    setIsLoading(true);
    try {
      await createAccount({
        ...formData,
        current_balance: formData.opening_balance,
      });
      
      setFormData({
        account_code: '',
        account_name: '',
        account_type_id: '',
        description: '',
        opening_balance: 0,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAccountTypes = accountTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, AccountType[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border-neutral-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code" className="text-neutral-300">Account Code *</Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="e.g., 1000"
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name" className="text-neutral-300">Account Name *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="e.g., Cash"
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_type" className="text-neutral-300">Account Type *</Label>
            <Select
              value={formData.account_type_id}
              onValueChange={(value) => setFormData({ ...formData, account_type_id: value })}
              required
            >
              <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950 border-neutral-800">
                {Object.entries(groupedAccountTypes).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {category}
                    </div>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white hover:bg-neutral-800">
                        {type.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_balance" className="text-neutral-300">Opening Balance</Label>
            <Input
              id="opening_balance"
              type="number"
              step="0.01"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-neutral-300">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any notes or details about this account..."
              className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-neutral-700 hover:bg-neutral-600 text-white"
            >
              {isLoading ? 'Creating...' : 'Create & Generate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
