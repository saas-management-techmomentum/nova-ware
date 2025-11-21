
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Repeat } from 'lucide-react';
import { useBilling } from '@/contexts/BillingContext';
import { useClients } from '@/contexts/ClientsContext';

interface RecurringInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecurringInvoiceDialog: React.FC<RecurringInvoiceDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { createRecurringInvoice, invoices } = useBilling();
  const { clients } = useClients();
  
  const [formData, setFormData] = useState({
    client_id: '',
    template_invoice_id: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    interval_count: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  // Filter invoices that can be used as templates (draft or sent status)
  const templateInvoices = invoices.filter(inv => 
    inv.status === 'draft' || inv.status === 'sent'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.template_invoice_id) {
      return;
    }

    // Calculate next invoice date based on frequency
    const startDate = new Date(formData.start_date);
    let nextInvoiceDate = new Date(startDate);
    
    switch (formData.frequency) {
      case 'weekly':
        nextInvoiceDate.setDate(nextInvoiceDate.getDate() + (7 * formData.interval_count));
        break;
      case 'monthly':
        nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + formData.interval_count);
        break;
      case 'quarterly':
        nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + (3 * formData.interval_count));
        break;
      case 'yearly':
        nextInvoiceDate.setFullYear(nextInvoiceDate.getFullYear() + formData.interval_count);
        break;
    }

    try {
      await createRecurringInvoice({
        ...formData,
        next_invoice_date: nextInvoiceDate.toISOString().split('T')[0],
        is_active: true,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      template_invoice_id: '',
      frequency: 'monthly',
      interval_count: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Repeat className="h-5 w-5" />
            <span>Create Recurring Invoice</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Client</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => setFormData({...formData, client_id: value})}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Template Invoice</Label>
              <Select 
                value={formData.template_invoice_id} 
                onValueChange={(value) => setFormData({...formData, template_invoice_id: value})}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {templateInvoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - ${invoice.total_amount.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Frequency</Label>
              <Select 
                value={formData.frequency} 
                onValueChange={(value: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => 
                  setFormData({...formData, frequency: value})}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Interval</Label>
              <Input
                type="number"
                min="1"
                value={formData.interval_count}
                onChange={(e) => setFormData({...formData, interval_count: parseInt(e.target.value) || 1})}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Start Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">End Date (Optional)</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formData.client_id || !formData.template_invoice_id}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Create Recurring Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
