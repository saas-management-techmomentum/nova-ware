
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Send, CreditCard } from 'lucide-react';
import { Invoice } from '@/hooks/useWarehouseScopedBilling';
import { useClients } from '@/hooks/useClients';

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onGeneratePDF: (invoiceId: string) => void;
  onSendEmail: (invoiceId: string) => void;
  onCreatePaymentLink: (invoiceId: string) => void;
}

export const InvoiceViewDialog: React.FC<InvoiceViewDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onGeneratePDF,
  onSendEmail,
  onCreatePaymentLink
}) => {
  const { clients } = useClients();

  if (!invoice) return null;

  const client = clients.find(c => c.id === invoice.client_id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500 text-white';
      case 'sent':
        return 'bg-blue-500 text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  // Helper function to normalize item data
  const normalizeItem = (item: any) => {
    return {
      description: item.name || item.description || 'Unknown Item',
      quantity: item.quantity || 0,
      price: item.unit_price || item.unit_rate || 0,
      amount: item.total_amount || 0,
      sku: item.sku,
      service_type: item.service_type,
      type: item.name ? 'product' : 'service' // Determine if it's a product or service
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-300 mb-2">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Number:</span>
                  <span>{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-300 mb-2">Client Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span>{client?.name || 'Unknown Client'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span>{client?.contactEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span>{client?.contactPhone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Billing Period */}
          <div>
            <h3 className="font-semibold text-slate-300 mb-2">Billing Period</h3>
            <div className="text-sm text-slate-400">
              {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
            </div>
          </div>

          {/* Line Items */}
          {invoice.items && invoice.items.length > 0 && (
            <>
              <Separator className="bg-slate-600" />
              <div>
                <h3 className="font-semibold text-slate-300 mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-slate-300">Description</th>
                        <th className="text-left py-2 text-slate-300">Type</th>
                        <th className="text-right py-2 text-slate-300">Qty</th>
                        <th className="text-right py-2 text-slate-300">Price</th>
                        <th className="text-right py-2 text-slate-300">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => {
                        const normalizedItem = normalizeItem(item);
                        return (
                          <tr key={index} className="border-b border-slate-700">
                            <td className="py-2 text-white">
                              <div>
                                <div className="font-medium">{normalizedItem.description}</div>
                                {normalizedItem.sku && (
                                  <div className="text-xs text-slate-400">SKU: {normalizedItem.sku}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-slate-300">
                              <Badge variant="outline" className="text-xs">
                                {normalizedItem.type === 'product' ? 'Product' : normalizedItem.service_type || 'Service'}
                              </Badge>
                            </td>
                            <td className="py-2 text-right text-slate-300">{normalizedItem.quantity}</td>
                            <td className="py-2 text-right text-slate-300">${normalizedItem.price.toFixed(2)}</td>
                            <td className="py-2 text-right text-white font-medium">${normalizedItem.amount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <Separator className="bg-slate-600" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-white">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax:</span>
                <span className="text-white">${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <Separator className="bg-slate-600" />
              <div className="flex justify-between font-bold text-lg">
                <span className="text-slate-300">Total:</span>
                <span className="text-white">${invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator className="bg-slate-600" />
              <div>
                <h3 className="font-semibold text-slate-300 mb-2">Notes</h3>
                <p className="text-sm text-slate-400">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onGeneratePDF(invoice.id)}
              className="bg-white text-black border-slate-300 hover:bg-white hover:text-black"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>

            <Button 
              variant="outline" 
              onClick={() => onSendEmail(invoice.id)}
              className="bg-white text-black border-slate-300 hover:bg-white hover:text-black"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>

            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <Button 
                variant="outline" 
                onClick={() => onCreatePaymentLink(invoice.id)}
                className="bg-white text-black border-slate-300 hover:bg-white hover:text-black"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Link
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
