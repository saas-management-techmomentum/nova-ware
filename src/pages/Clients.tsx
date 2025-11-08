
import React, { useState } from 'react';
import { PlusCircle, User, Search, Mail, Phone, Building, MapPin, FileText, Edit, Trash2, ChevronDown, FileArchive, CreditCard, IdCard, Truck, Receipt, AlertCircle, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from '@/contexts/ClientsContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import AddClientDialog from '@/components/orders/AddClientDialog';
import EditClientDialog from '@/components/clients/EditClientDialog';
import WarehouseContextIndicator from '@/components/warehouse/WarehouseContextIndicator';

const Clients = () => {
  const { clients, isLoading, deleteClient, refetch } = useClients();
  const { selectedWarehouse, isUserAdmin } = useWarehouse();
  const { userRoles, warehouseAssignments, isAdmin } = useUserPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (client.contact_person && client.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.tax_id && client.tax_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteClient = async (id: string) => {
    try {
      console.log('Attempting to delete client with ID:', id);
      await deleteClient(id);
      console.log('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleAddClient = async (clientData: any) => {
    try {
      // The addClient function is already called in the dialog
      // Just refresh the data to ensure we have the latest
      await refetch();
    } catch (error) {
      console.error('Error handling client addition:', error);
    }
  };

  const handleEditComplete = async () => {
    setIsEditDialogOpen(false);
    setSelectedClient(null);
    await refetch();
  };

  // Check if user can edit clients (admin or manager)
  const canEditClients = () => {
    // Global admin can edit all clients
    if (isAdmin) return true;
    
    // Check if user is admin in any company
    if (isUserAdmin) return true;
    
    // Check if user is manager in the selected warehouse
    if (selectedWarehouse) {
      const warehouseAssignment = warehouseAssignments.find(w => w.warehouse_id === selectedWarehouse);
      return warehouseAssignment?.role === 'manager';
    }
    
    return false;
  };

  // Show warehouse selection prompt only for non-admin users without warehouse access
  if (!selectedWarehouse && !isUserAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Client Information</h1>
        </div>
        
        <WarehouseContextIndicator />
        
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 mb-4 text-neutral-500" />
            <p className="text-lg font-medium mb-2 text-white">Select a Warehouse</p>
            <p className="text-sm text-neutral-400 text-center max-w-md">
              Please select a warehouse from the header to view and manage clients for that location. Clients are now warehouse-specific.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Client Information</h1>
          {selectedWarehouse && (
            <AddClientDialog 
              onClientAdded={handleAddClient}
              trigger={
                <Button 
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900"
                >
                  <PlusCircle size={16} />
                  <span>Add Client</span>
                </Button>
              }
            />
          )}
        </div>
        
        <WarehouseContextIndicator />
        
        <div className="flex items-center max-w-sm space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-neutral-900 border-neutral-800 text-white"
            />
          </div>
        </div>
        
        <div className="rounded-lg border border-neutral-900 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 bg-neutral-900">
              <div className="text-white">Loading clients...</div>
            </div>
          ) : filteredClients.length > 0 ? (
            <Table>
              <TableHeader className="bg-neutral-950">
                <TableRow className="border-neutral-900">
                  <TableHead className="text-neutral-300">Company</TableHead>
                  <TableHead className="text-neutral-300">Contact Person</TableHead>
                  <TableHead className="text-neutral-300">Email</TableHead>
                  <TableHead className="text-neutral-300">Phone</TableHead>
                  <TableHead className="text-neutral-300">Business Type</TableHead>
                  <TableHead className="text-neutral-300">Payment Terms</TableHead>
                  <TableHead className="text-neutral-300 w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="border-neutral-900 hover:bg-neutral-900/30"
                  >
                    <TableCell 
                      className="font-medium text-white cursor-pointer"
                      onClick={() => handleViewClient(client)}
                    >
                      <div className="flex items-center gap-2">
                        {client.name}
                        {!selectedWarehouse && (
                          <Warehouse className="h-3 w-3 text-neutral-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-300">{client.contact_person || 'N/A'}</TableCell>
                    <TableCell className="text-neutral-300">{client.contact_email}</TableCell>
                    <TableCell className="text-neutral-300">{client.contact_phone}</TableCell>
                    <TableCell className="text-neutral-300">{client.business_type || 'Not specified'}</TableCell>
                    <TableCell className="text-neutral-300">{client.payment_terms || 'Not specified'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-neutral-900">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-white min-w-[160px]">
                          <DropdownMenuItem 
                            onClick={() => handleViewClient(client)}
                            className="cursor-pointer hover:bg-neutral-900 focus:bg-neutral-900"
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canEditClients() && (
                            <DropdownMenuItem 
                              onClick={() => handleEditClient(client)}
                              className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClient(client.id)}
                            className="cursor-pointer text-rose-500 hover:bg-slate-800 focus:bg-slate-800 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card className="bg-slate-800 border-slate-700 m-4">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building className="h-16 w-16 mb-4 text-slate-500" />
                <p className="text-lg font-medium mb-2 text-white">No Clients Found</p>
                <p className="text-sm text-slate-400 text-center max-w-md">
                  {searchTerm ? 'No clients match your search criteria.' : 
                   selectedWarehouse ? 'Create your first client for this warehouse to get started.' :
                   'No clients found across accessible warehouses. Clients are now warehouse-specific.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedClient && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl text-white flex items-center gap-2">
                    <Building className="h-5 w-5 text-indigo-400" />
                    {selectedClient.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* Contact Information */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 space-y-4">
                      <h3 className="text-lg font-medium text-white mb-3">Contact Information</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-indigo-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-300">Contact Person</p>
                            <p className="text-white">{selectedClient.contact_person || 'Not provided'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-indigo-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-300">Email</p>
                            <p className="text-white">{selectedClient.contact_email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">Phone</p>
                          <p className="text-white">{selectedClient.contact_phone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 space-y-4">
                      <h3 className="text-lg font-medium text-white mb-3">Address Information</h3>
                      
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">Shipping Address</p>
                          <p className="text-white whitespace-pre-line">{selectedClient.shipping_address || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Receipt className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">Billing Address</p>
                          <p className="text-white whitespace-pre-line">
                            {selectedClient.billing_address ? selectedClient.billing_address : 'Same as shipping address'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Information */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 space-y-4">
                      <h3 className="text-lg font-medium text-white mb-3">Business Information</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <IdCard className="h-5 w-5 text-indigo-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-300">Tax ID</p>
                            <p className="text-white">{selectedClient.tax_id || 'Not provided'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-indigo-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-300">Business Type</p>
                            <p className="text-white">{selectedClient.business_type || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">Payment Terms</p>
                          <p className="text-white">{selectedClient.payment_terms || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileArchive className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">Resale Certificate</p>
                          {selectedClient.resale_certificate_url ? (
                            <a 
                              href={selectedClient.resale_certificate_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 underline"
                            >
                              View Certificate
                            </a>
                          ) : (
                            <p className="text-slate-400">No certificate uploaded</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <DialogFooter className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewDialogOpen(false)}
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <EditClientDialog
          client={selectedClient}
          isOpen={isEditDialogOpen}
          onClose={handleEditComplete}
        />
      </div>
    </>
  );
};

export default Clients;
