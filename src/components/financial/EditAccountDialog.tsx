
import React, { useState, useEffect } from 'react';
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

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type_id: string;
  description?: string;
  current_balance: number;
}

interface EditAccountDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accountTypes: AccountType[];
}

export const EditAccountDialog = ({ account, open, onOpenChange, onSuccess, accountTypes }: EditAccountDialogProps) => {
  const { updateAccount } = useWarehouseScopedAccounts();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type_id: '',
    description: '',
    current_balance: 0,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        account_code: account.account_code || '',
        account_name: account.account_name || '',
        account_type_id: account.account_type_id || '',
        description: account.description || '',
        current_balance: account.current_balance || 0,
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_code || !formData.account_name || !formData.account_type_id) {
      return;
    }

    setIsLoading(true);
    try {
      await updateAccount(account.id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error updating account:', error);
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_account_code">Account Code *</Label>
              <Input
                id="edit_account_code"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="e.g., 1000"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_account_name">Account Name *</Label>
              <Input
                id="edit_account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="e.g., Cash"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit_account_type">Account Type *</Label>
            <Select
              value={formData.account_type_id}
              onValueChange={(value) => setFormData({ ...formData, account_type_id: value })}
              required
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {Object.entries(groupedAccountTypes).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {category}
                    </div>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white hover:bg-slate-600">
                        {type.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit_current_balance">Current Balance</Label>
            <Input
              id="edit_current_balance"
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="bg-slate-700 border-slate-600 text-white resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Updating...' : 'Update Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
