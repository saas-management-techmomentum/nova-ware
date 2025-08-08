import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    client_name: string;
    total_amount: number;
    paid_amount: number;
  } | null;
  onRecordPayment: (paymentData: {
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }) => void;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onRecordPayment
}) => {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_date: new Date(),
    payment_method: '',
    reference_number: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    onRecordPayment({
      invoice_id: invoice.id,
      amount: paymentData.amount,
      payment_date: paymentData.payment_date.toISOString().split('T')[0],
      payment_method: paymentData.payment_method,
      reference_number: paymentData.reference_number || undefined,
      notes: paymentData.notes || undefined
    });

    // Reset form
    setPaymentData({
      amount: 0,
      payment_date: new Date(),
      payment_method: '',
      reference_number: '',
      notes: ''
    });
    onOpenChange(false);
  };

  const outstandingAmount = invoice ? invoice.total_amount - invoice.paid_amount : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Record Payment
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {invoice && (
              <>
                Recording payment for {invoice.invoice_number} - {invoice.client_name}
                <br />
                Outstanding Balance: ${outstandingAmount.toFixed(2)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={outstandingAmount}
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Enter payment amount"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentData(prev => ({ ...prev, amount: outstandingAmount }))}
                  className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Full Amount
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentData(prev => ({ ...prev, amount: outstandingAmount / 2 }))}
                  className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Half Amount
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method" className="text-slate-300">Payment Method</Label>
              <Select value={paymentData.payment_method} onValueChange={(value) => 
                setPaymentData(prev => ({ ...prev, payment_method: value }))
              }>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-white hover:bg-slate-700",
                      !paymentData.payment_date && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentData.payment_date ? format(paymentData.payment_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentData.payment_date}
                    onSelect={(date) => date && setPaymentData(prev => ({ ...prev, payment_date: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number" className="text-slate-300">Reference Number (Optional)</Label>
              <Input
                id="reference_number"
                value={paymentData.reference_number}
                onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Check number, transaction ID, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Additional payment notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!paymentData.amount || !paymentData.payment_method}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};