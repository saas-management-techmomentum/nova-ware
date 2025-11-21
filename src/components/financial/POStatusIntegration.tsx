import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, FileText, Eye, ExternalLink } from 'lucide-react';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { VendorBill } from '@/hooks/useAccountsPayable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface POStatusIntegrationProps {
  purchaseOrder: PurchaseOrder;
  onCreateBill?: () => void;
}

interface LinkedBill {
  id: string;
  bill_number: string;
  amount: number;
  status: string;
  paid_amount: number;
  due_date: string;
  issue_date: string;
}

export const POStatusIntegration: React.FC<POStatusIntegrationProps> = ({
  purchaseOrder,
  onCreateBill
}) => {
  const [linkedBills, setLinkedBills] = useState<LinkedBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const { toast } = useToast();

  const fetchLinkedBills = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_bills' as any)
        .select('id, bill_number, amount, status, paid_amount, due_date, issue_date')
        .eq('po_id', purchaseOrder.id);

      if (error) throw error;
      setLinkedBills((data as any) || []);
    } catch (err) {
      console.error('Error fetching linked bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createVendorBill = async () => {
    try {
      const billNumber = `BILL-${purchaseOrder.po_number}-${Date.now()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const billData = {
        bill_number: billNumber,
        vendor_name: purchaseOrder.vendor_name,
        po_id: purchaseOrder.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        amount: purchaseOrder.total_amount,
        description: `Bill for PO ${purchaseOrder.po_number}`,
        notes: `Generated from Purchase Order ${purchaseOrder.po_number}`,
        user_id: purchaseOrder.user_id,
        warehouse_id: purchaseOrder.warehouse_id,
        company_id: purchaseOrder.company_id
      };

      const { error } = await supabase
        .from('vendor_bills')
        .insert([billData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor bill created successfully",
      });

      await fetchLinkedBills();
      onCreateBill?.();
    } catch (err) {
      console.error('Error creating vendor bill:', err);
      toast({
        title: "Error",
        description: "Failed to create vendor bill",
        variant: "destructive",
      });
    }
  };

  const getPaymentStatus = () => {
    if (linkedBills.length === 0) return { status: 'no-bill', label: 'No Bill Created', color: 'secondary' };
    
    const totalAmount = linkedBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalPaid = linkedBills.reduce((sum, bill) => sum + bill.paid_amount, 0);
    
    if (totalPaid >= totalAmount) return { status: 'paid', label: 'Paid', color: 'success' };
    if (totalPaid > 0) return { status: 'partial', label: 'Partially Paid', color: 'warning' };
    
    const hasOverdue = linkedBills.some(bill => 
      new Date(bill.due_date) < new Date() && bill.status !== 'paid'
    );
    
    if (hasOverdue) return { status: 'overdue', label: 'Overdue', color: 'destructive' };
    return { status: 'unpaid', label: 'Unpaid', color: 'secondary' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500';
      case 'approved': return 'bg-blue-500';
      case 'received': return 'bg-green-500';
      case 'partially_received': return 'bg-yellow-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'partially_paid': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  useEffect(() => {
    fetchLinkedBills();
  }, [purchaseOrder.id]);

  const paymentStatus = getPaymentStatus();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          PO Status & Payment Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Purchase Order Status</p>
            <Badge className={`${getStatusColor(purchaseOrder.status)} text-white`}>
              {purchaseOrder.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Payment Status</p>
            <Badge className={`${getBillStatusColor(paymentStatus.status)} text-white`}>
              {paymentStatus.label}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Linked Vendor Bills ({linkedBills.length})</p>
            {purchaseOrder.status === 'received' && linkedBills.length === 0 && (
              <Button onClick={createVendorBill} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Receipt className="w-4 h-4 mr-2" />
                Create Bill
              </Button>
            )}
          </div>

          {linkedBills.length > 0 ? (
            <div className="space-y-2">
              {linkedBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{bill.bill_number}</p>
                    <p className="text-xs text-slate-400">
                      Amount: ${bill.amount.toFixed(2)} • 
                      Paid: ${bill.paid_amount.toFixed(2)} • 
                      Due: {new Date(bill.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getBillStatusColor(bill.status)} text-white`}>
                      {bill.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Bill Details - {bill.bill_number}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-400">Issue Date</p>
                              <p className="text-sm">{new Date(bill.issue_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Due Date</p>
                              <p className="text-sm">{new Date(bill.due_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-400">Total Amount</p>
                              <p className="text-sm">${bill.amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Paid Amount</p>
                              <p className="text-sm">${bill.paid_amount.toFixed(2)}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Outstanding</p>
                            <p className="text-lg font-semibold">${(bill.amount - bill.paid_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
              
              <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Bills in AP
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Linked Vendor Bills for PO {purchaseOrder.po_number}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Bill Number</TableHead>
                          <TableHead className="text-slate-300">Issue Date</TableHead>
                          <TableHead className="text-slate-300">Due Date</TableHead>
                          <TableHead className="text-slate-300">Amount</TableHead>
                          <TableHead className="text-slate-300">Paid</TableHead>
                          <TableHead className="text-slate-300">Outstanding</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedBills.map((bill) => (
                          <TableRow key={bill.id} className="border-slate-700">
                            <TableCell className="text-white">{bill.bill_number}</TableCell>
                            <TableCell className="text-slate-300">
                              {new Date(bill.issue_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {new Date(bill.due_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-white">${bill.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-green-400">${bill.paid_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-yellow-400">
                              ${(bill.amount - bill.paid_amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getBillStatusColor(bill.status)} text-white`}>
                                {bill.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400">
              {purchaseOrder.status === 'received' ? (
                <p className="text-sm">Ready to create vendor bill</p>
              ) : (
                <p className="text-sm">No vendor bills linked to this PO</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-700">
          {linkedBills.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/app/financial#accounts-payable', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in AP
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};