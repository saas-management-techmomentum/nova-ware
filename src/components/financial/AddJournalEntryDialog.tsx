
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useWarehouse } from '@/contexts/WarehouseContext';

interface AddJournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddJournalEntryDialog = ({ open, onOpenChange, onSuccess }: AddJournalEntryDialogProps) => {
  const { createJournalEntry } = useJournalEntries();
  const { selectedWarehouse } = useWarehouse();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    entry_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    total_amount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entry_number || !formData.description) {
      return;
    }

    setIsLoading(true);
    try {
      await createJournalEntry({
        ...formData,
        warehouse_id: selectedWarehouse
      });
      
      setFormData({
        entry_number: '',
        entry_date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        total_amount: 0,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Journal Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry_number">Entry Number *</Label>
              <Input
                id="entry_number"
                value={formData.entry_number}
                onChange={(e) => setFormData({ ...formData, entry_number: e.target.value })}
                placeholder="JE-001"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="entry_date">Entry Date *</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Invoice #, Check #, etc."
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the transaction"
              className="bg-slate-700 border-slate-600 text-white resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="total_amount">Total Amount</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="bg-slate-700 border-slate-600 text-white"
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
              {isLoading ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
