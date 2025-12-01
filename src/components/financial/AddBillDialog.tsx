import React, { useState, useEffect } from 'react';
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
import { CalendarIcon, Plus, FileText, Link } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AddBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: (billData: any) => Promise<void>;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_name: string;
  total_amount: number;
  status: string;
}

export const AddBillDialog: React.FC<AddBillDialogProps> = ({
  isOpen,
  onClose,
  onBillCreated,
}) => {
  const [billNumber, setBillNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPO, setSelectedPO] = useState<string>('');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPOs, setLoadingPOs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPurchaseOrders();
      resetForm();
    }
  }, [isOpen]);

  const fetchPurchaseOrders = async () => {
    setLoadingPOs(true);
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, po_number, vendor_name, total_amount, status')
        .in('status', ['approved', 'confirmed', 'received', 'draft'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoadingPOs(false);
    }
  };

  const handlePOSelection = (poId: string) => {
    setSelectedPO(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setVendorName(po.vendor_name);
      setAmount(po.total_amount.toString());
      setDescription(`Bill for PO ${po.po_number}`);
    }
  };

  const resetForm = () => {
    setBillNumber('');
    setVendorName('');
    setAmount('');
    setIssueDate(new Date());
    setDueDate(new Date());
    setDescription('');
    setNotes('');
    setSelectedPO('');
  };

  const generateBillNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `BILL-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber || !vendorName || !amount) return;

    setLoading(true);
    try {
      const billData = {
        bill_number: billNumber,
        vendor_name: vendorName,
        po_id: selectedPO || null,
        issue_date: format(issueDate, 'yyyy-MM-dd'),
        due_date: format(dueDate, 'yyyy-MM-dd'),
        amount: parseFloat(amount),
        description: description,
        notes: notes
      };

      await onBillCreated(billData);
      onClose();
    } catch (error) {
      console.error('Error creating bill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Add Vendor Bill
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new vendor bill and link it to a purchase order if applicable
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Link to Purchase Order */}
          <div className="space-y-2">
            <Label htmlFor="po" className="text-slate-300 flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link to Purchase Order (Optional)
            </Label>
            <Select value={selectedPO} onValueChange={handlePOSelection}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder={loadingPOs ? "Loading POs..." : "Select a purchase order"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.po_number} - {po.vendor_name} ({new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(po.total_amount)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bill Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billNumber" className="text-slate-300">Bill Number</Label>
              <div className="flex gap-2">
                <Input
                  id="billNumber"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="BILL-001"
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBillNumber(generateBillNumber())}
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-slate-300">Vendor Name</Label>
              <Input
                id="vendor"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="ABC Supplies Inc."
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300">Bill Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Payment Terms</Label>
              <Select 
                onValueChange={(value) => {
                  const days = parseInt(value);
                  const newDueDate = new Date(issueDate);
                  newDueDate.setDate(newDueDate.getDate() + days);
                  setDueDate(newDueDate);
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="0">Due on Receipt</SelectItem>
                  <SelectItem value="15">Net 15</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="45">Net 45</SelectItem>
                  <SelectItem value="60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issueDate" className="text-slate-300">Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-white",
                      !issueDate && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(date) => date && setIssueDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-slate-300">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-white",
                      !dueDate && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of goods/services"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms..."
              className="bg-slate-800 border-slate-600 text-white resize-none"
              rows={3}
            />
          </div>

          {/* GL Impact Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-blue-400 font-medium mb-2">GL Impact</div>
              <div className="grid gap-2 text-sm">
                <div className="text-slate-300">
                  Debit: Expense Account - {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(parseFloat(amount))}
                </div>
                <div className="text-slate-300">
                  Credit: Accounts Payable - {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(parseFloat(amount))}
                </div>
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
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading || !billNumber || !vendorName || !amount}
            >
              {loading ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};