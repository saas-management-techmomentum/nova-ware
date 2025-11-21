import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VendorBill } from '@/hooks/useAccountsPayable';

interface RecordAPPaymentDialogProps {
  bill: VendorBill | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: (billId: string, paymentData: any) => Promise<void>;
}

export const RecordAPPaymentDialog: React.FC<RecordAPPaymentDialogProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentRecorded,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const outstandingAmount = bill ? bill.amount - bill.paid_amount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill || !paymentAmount || !paymentMethod) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > outstandingAmount) {
      alert('Invalid payment amount');
      return;
    }

    setLoading(true);
    try {
      await onPaymentRecorded(bill.id, {
        payment_amount: amount,
        payment_method: paymentMethod,
        payment_date: format(paymentDate, 'yyyy-MM-dd'),
        reference_number: referenceNumber,
        notes: notes
      });

      // Reset form
      setPaymentAmount('');
      setPaymentMethod('');
      setPaymentDate(new Date());
      setReferenceNumber('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullPayment = () => {
    setPaymentAmount(outstandingAmount.toString());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!bill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-400" />
            Record Payment - {bill.vendor_name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Record a payment for bill {bill.bill_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bill Summary */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-sm text-slate-400">Bill Amount</div>
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(bill.amount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Paid Amount</div>
                <div className="text-lg font-semibold text-green-400">
                  {formatCurrency(bill.paid_amount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Outstanding</div>
                <div className="text-lg font-semibold text-red-400">
                  {formatCurrency(outstandingAmount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Due Date</div>
                <div className="text-lg font-semibold text-white">
                  {new Date(bill.due_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">Payment Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-800 border-slate-600 text-white"
                    required
                    max={outstandingAmount}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFullPayment}
                    className="px-3 whitespace-nowrap"
                  >
                    Full
                  </Button>
                </div>
                {paymentAmount && parseFloat(paymentAmount) > outstandingAmount && (
                  <div className="text-red-400 text-sm">
                    Amount cannot exceed outstanding balance
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="method" className="text-slate-300">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-300">Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-white",
                        !paymentDate && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => date && setPaymentDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference" className="text-slate-300">Reference Number</Label>
                <Input
                  id="reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Check #, confirmation #, etc."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this payment..."
                className="bg-slate-800 border-slate-600 text-white resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Payment Impact */}
          {paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) <= outstandingAmount && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-blue-400 font-medium mb-2">Payment Impact</div>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div className="text-slate-300">
                  New Paid Amount: <span className="text-white font-medium">
                    {formatCurrency(bill.paid_amount + parseFloat(paymentAmount))}
                  </span>
                </div>
                <div className="text-slate-300">
                  Remaining Balance: <span className="text-white font-medium">
                    {formatCurrency(outstandingAmount - parseFloat(paymentAmount))}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                GL Impact: Debit AP ({formatCurrency(parseFloat(paymentAmount))}), Credit Cash ({formatCurrency(parseFloat(paymentAmount))})
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || !paymentAmount || !paymentMethod || parseFloat(paymentAmount) <= 0}
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};