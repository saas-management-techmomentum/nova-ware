import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';

interface PaymentStatusBadgeProps {
  purchaseOrder: PurchaseOrder;
}

interface LinkedBill {
  id: string;
  bill_number: string;
  amount: number;
  status: string;
  paid_amount: number;
  due_date: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  purchaseOrder
}) => {
  const [linkedBills, setLinkedBills] = useState<LinkedBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLinkedBills = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_bills' as any)
        .select('id, bill_number, amount, status, paid_amount, due_date')
        .eq('po_id', purchaseOrder.id);

      if (error) throw error;
      setLinkedBills((data as any) || []);
    } catch (err) {
      console.error('Error fetching linked bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatus = () => {
    if (linkedBills.length === 0) return { status: 'no-bill', label: 'No Bill', color: 'bg-slate-500' };
    
    const totalAmount = linkedBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalPaid = linkedBills.reduce((sum, bill) => sum + bill.paid_amount, 0);
    
    if (totalPaid >= totalAmount) return { status: 'paid', label: 'Paid', color: 'bg-green-500' };
    if (totalPaid > 0) return { status: 'partial', label: 'Partial', color: 'bg-yellow-500' };
    
    const hasOverdue = linkedBills.some(bill => 
      new Date(bill.due_date) < new Date() && bill.status !== 'paid'
    );
    
    if (hasOverdue) return { status: 'overdue', label: 'Overdue', color: 'bg-red-500' };
    return { status: 'unpaid', label: 'Unpaid', color: 'bg-slate-500' };
  };

  useEffect(() => {
    fetchLinkedBills();
  }, [purchaseOrder.id]);

  const paymentStatus = getPaymentStatus();

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${paymentStatus.color} text-white`}>
        {paymentStatus.label}
      </Badge>
      
      {linkedBills.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Eye className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Payment Details - PO {purchaseOrder.po_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Vendor</p>
                  <p className="text-sm">{purchaseOrder.vendor_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">PO Amount</p>
                  <p className="text-sm">${purchaseOrder.total_amount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Linked Bills ({linkedBills.length})</p>
                {linkedBills.map((bill) => (
                  <div key={bill.id} className="p-2 bg-slate-700 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{bill.bill_number}</span>
                      <Badge className={`${paymentStatus.color} text-white text-xs`}>
                        {bill.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Amount: ${bill.amount.toFixed(2)} • 
                      Paid: ${bill.paid_amount.toFixed(2)} • 
                      Due: {new Date(bill.due_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};