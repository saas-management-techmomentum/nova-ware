
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { useBilling } from '@/contexts/BillingContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Plus, Send, Download, CreditCard, Eye, FileText, ArrowRight, Building2, AlertTriangle, Mail, MailCheck, Repeat, Pause, Play, Trash2 } from 'lucide-react';
import { CreateInvoiceDialog } from './CreateInvoiceDialog';
import { InvoiceViewDialog } from './InvoiceViewDialog';
import { InvoiceEmailDialog } from './InvoiceEmailDialog';
import { RecurringInvoiceDialog } from './RecurringInvoiceDialog';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

export const EnhancedInvoiceManagement = () => {
  const { invoices, recurringInvoices, isLoading, updateInvoiceStatus, generateInvoicePDF, createPaymentLink, updateRecurringInvoice, deleteRecurringInvoice } = useBilling();
  const { selectedWarehouse, canViewAllWarehouses, warehouses } = useWarehouse();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  // Pagination calculations
  const totalInvoices = invoices.length;
  const totalPages = Math.ceil(totalInvoices / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    return invoices.slice(startIndex, endIndex);
  }, [invoices, startIndex, endIndex]);

  // Reset to page 1 when warehouse changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedWarehouse]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(parseInt(newItemsPerPage));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get warehouse name helper function
  const getWarehouseName = (warehouseId: string | undefined) => {
    if (!warehouseId) return 'Unknown';
    const warehouse = warehouses.find(w => w.warehouse_id === warehouseId);
    return warehouse ? warehouse.warehouse_name : `WH-${warehouseId.slice(0, 8)}...`;
  };

  // Helper function to get inventory impact status
  const getInventoryImpactStatus = (invoice: any) => {
    const totalItemsWithStock = invoice.items?.filter(item => item.stock_at_creation && item.stock_at_creation > 0).length || 0;
    const lowStockItems = invoice.items?.filter(item => 
      item.stock_at_creation && item.stock_at_creation < item.quantity
    ).length || 0;
    const criticalStockItems = invoice.items?.filter(item => 
      item.stock_at_creation && item.stock_at_creation === 0
    ).length || 0;

    return {
      totalItemsWithStock,
      lowStockItems,
      criticalStockItems,
      hasStockIssues: lowStockItems > 0 || criticalStockItems > 0
    };
  };

  // Helper function to format email sent date
  const formatEmailSentDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const handleSendEmail = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setShowEmailDialog(true);
    }
  };

  const handleGeneratePDF = async (invoiceId) => {
    try {
      await generateInvoicePDF(invoiceId);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  const handleCreatePaymentLink = async (invoiceId) => {
    try {
      await createPaymentLink(invoiceId);
    } catch (error) {
      console.error('Failed to create payment link:', error);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus as 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled');
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const getNextLogicalStatus = (currentStatus: string) => {
    const nextStatuses = {
      'draft': 'sent',
      'sent': 'approved',
      'approved': 'paid',
      'paid': 'paid',
      'overdue': 'paid',
      'cancelled': 'cancelled'
    };
    return nextStatuses[currentStatus] || currentStatus;
  };

  if (isLoading) {
    return <div className="text-white">Loading invoices...</div>;
  }

  if (!selectedWarehouse && !canViewAllWarehouses) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 mb-4 text-neutral-500" />
          <p className="text-lg font-medium mb-2 text-white">Select a Warehouse</p>
          <p className="text-sm text-neutral-400 text-center max-w-md">
            Please select a warehouse to manage invoices for that location. Invoices are warehouse-specific.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Enhanced Invoice Management</h2>
          {isInCorporateOverview ? (
            <p className="text-neutral-400 mt-1">Showing invoices from all warehouses</p>
          ) : (
            <div className="flex items-center mt-1 text-neutral-400">
              <Building2 className="h-4 w-4 mr-1" />
              <span>Warehouse: {getWarehouseName(selectedWarehouse)}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          {!isInCorporateOverview && (
            <Button onClick={() => setShowRecurringDialog(true)} variant="outline" className="border-neutral-700">
              <Plus className="h-4 w-4 mr-2" />
              Recurring Invoice
            </Button>
          )}
          {!isInCorporateOverview && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-400" />
            Invoices
            {selectedWarehouse && (
              <span className="ml-2 text-sm text-neutral-400">
                ({totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''} for this warehouse)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalInvoices === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <FileText className="h-16 w-16 mb-4 text-neutral-500" />
              <p className="text-lg font-medium mb-2">No invoices found</p>
              <p className="text-sm text-neutral-500 text-center max-w-md mb-4">
                {isInCorporateOverview 
                  ? "No invoices found across all warehouses."
                  : `No invoices found for warehouse ${getWarehouseName(selectedWarehouse)}. Create your first invoice to start billing clients.`
                }
              </p>
              {!isInCorporateOverview && (
                <Button onClick={() => setShowCreateDialog(true)} className="bg-gray-800 hover:bg-gray-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-neutral-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalInvoices)} of {totalInvoices} invoices
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-400">Items per page:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-20 bg-neutral-800/50 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-300">Invoice #</TableHead>
                  <TableHead className="text-neutral-300">Client</TableHead>
                  <TableHead className="text-neutral-300">Date</TableHead>
                  <TableHead className="text-neutral-300">Due Date</TableHead>
                  <TableHead className="text-neutral-300">Amount</TableHead>
                  <TableHead className="text-slate-300">Items</TableHead>
                  <TableHead className="text-slate-300">Inventory Impact</TableHead>
                  <TableHead className="text-slate-300">Email Status</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Quick Action</TableHead>
                  {isInCorporateOverview && (
                    <TableHead className="text-slate-300">Warehouse</TableHead>
                  )}
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => {
                  const inventoryStatus = getInventoryImpactStatus(invoice);
                  const emailSentDate = formatEmailSentDate(invoice.email_sent_at);
                  
                  return (
                    <TableRow key={invoice.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-slate-300">
                        {invoice.client_name || invoice.client_id}
                      </TableCell>
                      <TableCell className="text-slate-300">{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-300">{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-white">${invoice.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">
                        {invoice.items?.length || 0} items
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex flex-col text-xs">
                          <span className="text-green-400">{inventoryStatus.totalItemsWithStock} tracked</span>
                          {inventoryStatus.lowStockItems > 0 && (
                            <span className="text-orange-400 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {inventoryStatus.lowStockItems} low stock
                            </span>
                          )}
                          {inventoryStatus.criticalStockItems > 0 && (
                            <span className="text-red-400 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {inventoryStatus.criticalStockItems} out of stock
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {emailSentDate ? (
                          <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                            <MailCheck className="h-3 w-3 mr-1" />
                            <span className="text-xs">Sent {emailSentDate}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="text-xs">Not sent</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        {invoice.status !== 'cancelled' && getNextLogicalStatus(invoice.status) !== invoice.status && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(invoice.id, getNextLogicalStatus(invoice.status))}
                            className="border-green-600 text-green-400 hover:bg-green-600/10"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {getNextLogicalStatus(invoice.status)}
                          </Button>
                        )}
                      </TableCell>
                      {isInCorporateOverview && (
                        <TableCell className="text-slate-300">
                          <div className="flex items-center text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {getWarehouseName(invoice.warehouse_id)}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice)}
                            className="border-slate-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select 
                            value={invoice.status} 
                            onValueChange={(value) => handleStatusChange(invoice.id, value)}
                          >
                            <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendEmail(invoice.id)}
                            className="border-gray-700 text-gray-400 hover:bg-gray-800/10"
                            title="Send Invoice Email"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePDF(invoice.id)}
                            className="border-slate-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(invoice.status === 'sent' || invoice.status === 'approved' || invoice.status === 'overdue') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreatePaymentLink(invoice.id)}
                              className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-slate-700'}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer hover:bg-slate-700"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            className="cursor-pointer hover:bg-slate-700"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-slate-700'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Invoices Section */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Repeat className="h-5 w-5 mr-2 text-neutral-400" />
            Recurring Invoices
            <span className="ml-2 text-sm text-neutral-400">
              ({recurringInvoices.length} schedule{recurringInvoices.length !== 1 ? 's' : ''})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recurringInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Repeat className="h-16 w-16 mb-4 text-neutral-500" />
              <p className="text-lg font-medium mb-2">No recurring invoices</p>
              <p className="text-sm text-neutral-500 text-center max-w-md mb-4">
                Set up recurring invoices to automatically generate invoices on a schedule.
              </p>
              {!isInCorporateOverview && (
                <Button onClick={() => setShowRecurringDialog(true)} variant="outline" className="border-neutral-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recurring Invoice
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-300">Client</TableHead>
                  <TableHead className="text-neutral-300">Template Invoice</TableHead>
                  <TableHead className="text-neutral-300">Frequency</TableHead>
                  <TableHead className="text-neutral-300">Next Invoice</TableHead>
                  <TableHead className="text-neutral-300">End Date</TableHead>
                  <TableHead className="text-neutral-300">Status</TableHead>
                  <TableHead className="text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvoices.map((recurring) => (
                  <TableRow key={recurring.id} className="border-neutral-700">
                    <TableCell className="text-white">
                      {recurring.template_data?.client_name || 'Unknown Client'}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      <div className="flex flex-col">
                        <span className="font-medium">{recurring.template_data?.invoice_number || 'N/A'}</span>
                        <span className="text-sm text-neutral-400">
                          ${recurring.template_data?.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      Every {recurring.interval_count} {recurring.frequency}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {new Date(recurring.next_invoice_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {recurring.end_date 
                        ? new Date(recurring.end_date).toLocaleDateString()
                        : <span className="text-neutral-500 italic">No end date</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={recurring.is_active ? 'default' : 'secondary'} className={recurring.is_active ? 'bg-green-600/20 text-green-400 border-green-600/30' : ''}>
                        {recurring.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRecurringInvoice(recurring.id, { is_active: !recurring.is_active })}
                          className="border-neutral-700"
                          title={recurring.is_active ? 'Pause recurring invoice' : 'Resume recurring invoice'}
                        >
                          {recurring.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRecurringInvoice(recurring.id)}
                          className="border-red-600/30 text-red-400 hover:bg-red-600/10"
                          title="Delete recurring invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />

      <InvoiceViewDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        invoice={selectedInvoice}
        onGeneratePDF={handleGeneratePDF}
        onSendEmail={handleSendEmail}
        onCreatePaymentLink={handleCreatePaymentLink}
      />

      <InvoiceEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        invoiceId={selectedInvoice?.id || ''}
        recipientEmail={selectedInvoice?.client_contact_email || selectedInvoice?.client_id || ''}
      />

      <RecurringInvoiceDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
      />
    </div>
  );
};
