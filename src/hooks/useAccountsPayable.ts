import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { toast } from '@/hooks/use-toast';

export interface VendorBill {
  id: string;
  bill_number: string;
  vendor_name: string;
  vendor_id?: string;
  po_id?: string;
  issue_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'pending_invoice' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  description?: string;
  notes?: string;
  attachment_url?: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  purchase_orders?: {
    id: string;
    po_number: string;
    vendor_name: string;
    status: string;
  };
}

export interface VendorBillPayment {
  id: string;
  bill_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface APSummary {
  totalPayable: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueNextWeek: number;
  dueIn30Days: number;
  aging: {
    current: number;
    days_30: number;
    days_60: number;
    days_90: number;
    days_90_plus: number;
  };
}

export const useAccountsPayable = () => {
  const { user } = useAuth();
  const { selectedWarehouse, companyId } = useWarehouse();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [payments, setPayments] = useState<VendorBillPayment[]>([]);
  const [apSummary, setApSummary] = useState<APSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBills = async () => {
    if (!user || !companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('vendor_bills')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch related purchase orders if po_id exists
      const billsWithPOs = await Promise.all(
        (data || []).map(async (bill) => {
          let purchaseOrder = undefined;
          
          if (bill.po_id) {
            const { data: poData } = await supabase
              .from('purchase_orders')
              .select('id, po_number, vendor_name, status')
              .eq('id', bill.po_id)
              .single();
            
            if (poData) {
              purchaseOrder = poData;
            }
          }

          // Update status based on due date and paid amount
          const paidAmount = bill.paid_amount || 0;
          const outstanding = bill.amount - paidAmount;
          const isOverdue = new Date(bill.due_date) < new Date() && outstanding > 0;
          
          let status = bill.status;
          if (outstanding === 0) {
            status = 'paid';
          } else if (isOverdue) {
            status = 'overdue';
          } else if (paidAmount > 0) {
            status = 'partially_paid';
          } else if (status === 'pending_invoice') {
            status = 'pending_invoice';
          } else {
            status = 'unpaid';
          }

          return {
            ...bill,
            paid_amount: paidAmount,
            status,
            purchase_orders: purchaseOrder,
          } as VendorBill;
        })
      );

      setBills(billsWithPOs);
      calculateAPSummary(billsWithPOs);
    } catch (err) {
      console.error('Error fetching vendor bills:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendor bills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('vendor_bill_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Map database columns to interface
      const mappedPayments = (data || []).map(payment => ({
        id: payment.id,
        bill_id: payment.vendor_bill_id || '',
        payment_amount: payment.amount,
        payment_method: payment.payment_method || '',
        payment_date: payment.payment_date,
        reference_number: payment.reference_number,
        notes: payment.notes,
        user_id: payment.user_id,
        created_at: payment.created_at || '',
      })) as VendorBillPayment[];
      
      setPayments(mappedPayments);
    } catch (err) {
      console.error('Error fetching vendor bill payments:', err);
    }
  };

  const calculateAPSummary = (billsList: VendorBill[]) => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(today.getDate() + 14);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const summary: APSummary = {
      totalPayable: 0,
      overdueAmount: 0,
      dueThisWeek: 0,
      dueNextWeek: 0,
      dueIn30Days: 0,
      aging: {
        current: 0,
        days_30: 0,
        days_60: 0,
        days_90: 0,
        days_90_plus: 0,
      },
    };

    billsList.forEach((bill) => {
      const outstanding = bill.amount - bill.paid_amount;
      if (outstanding <= 0) return; // Skip paid bills

      const dueDate = new Date(bill.due_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      summary.totalPayable += outstanding;

      // Overdue
      if (dueDate < today) {
        summary.overdueAmount += outstanding;

        // Aging buckets
        if (daysPastDue <= 30) {
          summary.aging.days_30 += outstanding;
        } else if (daysPastDue <= 60) {
          summary.aging.days_60 += outstanding;
        } else if (daysPastDue <= 90) {
          summary.aging.days_90 += outstanding;
        } else {
          summary.aging.days_90_plus += outstanding;
        }
      } else {
        summary.aging.current += outstanding;

        // Due soon
        if (dueDate <= sevenDaysFromNow) {
          summary.dueThisWeek += outstanding;
        } else if (dueDate <= fourteenDaysFromNow) {
          summary.dueNextWeek += outstanding;
        } else if (dueDate <= thirtyDaysFromNow) {
          summary.dueIn30Days += outstanding;
        }
      }
    });

    setApSummary(summary);
  };

  const createBill = async (billData: Partial<VendorBill>): Promise<void> => {
    if (!user || !companyId) {
      throw new Error('User not authenticated or company not selected');
    }

    try {
      const { error: insertError } = await supabase
        .from('vendor_bills')
        .insert({
          bill_number: billData.bill_number!,
          vendor_name: billData.vendor_name!,
          amount: billData.amount!,
          issue_date: billData.issue_date!,
          due_date: billData.due_date!,
          description: billData.description,
          notes: billData.notes,
          po_id: billData.po_id,
          user_id: user.id,
          company_id: companyId,
          warehouse_id: selectedWarehouse || null,
          paid_amount: 0,
          status: 'unpaid',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Vendor bill created successfully',
      });

      await fetchBills();
    } catch (err) {
      console.error('Error creating vendor bill:', err);
      toast({
        title: 'Error',
        description: 'Failed to create vendor bill',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const recordPayment = async (billId: string, paymentData: Partial<VendorBillPayment>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get the current bill
      const { data: bill, error: billError } = await supabase
        .from('vendor_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (billError) throw billError;

      const paymentAmount = paymentData.payment_amount || 0;
      const currentPaidAmount = bill.paid_amount || 0;
      const newPaidAmount = currentPaidAmount + paymentAmount;
      const outstanding = bill.amount - newPaidAmount;

      // Determine new status
      let newStatus = bill.status;
      if (outstanding === 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partially_paid';
      }

      // Insert payment record - map to database columns
      const { error: paymentError } = await supabase
        .from('vendor_bill_payments')
        .insert({
          vendor_bill_id: billId,
          amount: paymentAmount,
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date!,
          reference_number: paymentData.reference_number,
          notes: paymentData.notes,
          user_id: user.id,
        });

      if (paymentError) throw paymentError;

      // Update bill's paid amount and status
      const { error: updateError } = await supabase
        .from('vendor_bills')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
        })
        .eq('id', billId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });

      await fetchBills();
      await fetchPayments();
    } catch (err) {
      console.error('Error recording payment:', err);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchBills(), fetchPayments()]);
  };

  useEffect(() => {
    if (user && companyId) {
      fetchBills();
      fetchPayments();
    }
  }, [user, companyId, selectedWarehouse]);

  return {
    bills,
    payments,
    apSummary,
    loading,
    error,
    createBill,
    recordPayment,
    fetchBills,
    fetchPayments,
    refreshData,
  };
};
