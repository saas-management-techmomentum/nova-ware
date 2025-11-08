
import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/contexts/ClientsContext";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { Upload, X, AlertCircle } from "lucide-react";

interface AddClientDialogProps {
  onClientAdded: (client: { id: string, name: string }) => void;
  trigger?: React.ReactNode;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({ onClientAdded, trigger }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { addClient } = useClients();
  const { selectedWarehouse } = useWarehouse();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    shippingAddress: '',
    billingAddress: '',
    taxId: '',
    businessType: '',
    paymentTerms: '',
    resaleCertificateFile: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, resaleCertificateFile: file }));
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, resaleCertificateFile: null }));
  };

  const handleSameBillingAddressChange = (checked: boolean | "indeterminate") => {
    setSameBillingAddress(checked === true);
  };

  const uploadResaleCertificate = async (file: File, clientId: string): Promise<string | null> => {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/resale-certificate.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "File Upload Failed",
        description: "Failed to upload resale certificate",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check if warehouse is selected
    if (!selectedWarehouse) {
      toast({
        title: "Warehouse Required",
        description: "Please select a warehouse before adding a client. Clients are specific to each warehouse.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.name.trim()) {
      toast({
        title: "Client Name Required",
        description: "Please enter a name for the client",
        variant: "destructive"
      });
      return;
    }

    if (!formData.contactPerson.trim()) {
      toast({
        title: "Contact Person Required",
        description: "Please enter a contact person for the client",
        variant: "destructive"
      });
      return;
    }

    if (!formData.contactEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    if (!formData.contactPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    if (!formData.shippingAddress.trim()) {
      toast({
        title: "Shipping Address Required",
        description: "Please enter a shipping address",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    try {
      // Use the context's addClient function
      const clientData = {
        name: formData.name.trim(),
        contact_person: formData.contactPerson.trim(),
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim(),
        shipping_address: formData.shippingAddress.trim(),
        billing_address: sameBillingAddress ? formData.shippingAddress.trim() : formData.billingAddress.trim() || null,
        tax_id: formData.taxId.trim() || null,
        business_type: formData.businessType || null,
        payment_terms: formData.paymentTerms || null,
      };

      const newClient = await addClient(clientData);

      if (newClient) {
        let resaleCertificateUrl = null;

        // Upload resale certificate if provided
        if (formData.resaleCertificateFile) {
          resaleCertificateUrl = await uploadResaleCertificate(formData.resaleCertificateFile, newClient.id);
          
          if (resaleCertificateUrl) {
            // Update the client with the resale certificate URL
            const { error: updateError } = await supabase
              .from('clients')
              .update({ resale_certificate_url: resaleCertificateUrl })
              .eq('id', newClient.id);

            if (updateError) {
              console.error('Error updating resale certificate URL:', updateError);
            }
          }
        }

        onClientAdded({ id: newClient.id, name: newClient.name });
        setFormData({
          name: '',
          contactPerson: '',
          contactEmail: '',
          contactPhone: '',
          shippingAddress: '',
          billingAddress: '',
          taxId: '',
          businessType: '',
          paymentTerms: '',
          resaleCertificateFile: null
        });
        setSameBillingAddress(true);
        setOpen(false);
        toast({
          title: "Client Added",
          description: `Client has been added to the selected warehouse successfully`,
        });
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error Adding Client",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">Add New Client</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Client</DialogTitle>
          {!selectedWarehouse && (
            <div className="flex items-center gap-2 p-3 bg-orange-900/20 border border-orange-700 rounded-md">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <p className="text-sm text-orange-300">
                Please select a warehouse first. Clients are specific to each warehouse.
              </p>
            </div>
          )}
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client-name" className="text-neutral-300">Client Name *</Label>
              <Input
                id="client-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Company Name"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-person" className="text-slate-300">Contact Person *</Label>
              <Input
                id="contact-person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
                placeholder="Contact Person Name"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-email" className="text-slate-300">Email *</Label>
              <Input
                id="contact-email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                type="email"
                required
                placeholder="contact@company.com"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-phone" className="text-slate-300">Phone Number *</Label>
              <Input
                id="contact-phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
                placeholder="555-555-5555"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="shipping-address" className="text-slate-300">Shipping Address *</Label>
            <Textarea
              id="shipping-address"
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={handleInputChange}
              required
              placeholder="Full shipping address"
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="same-billing"
                checked={sameBillingAddress}
                onCheckedChange={handleSameBillingAddressChange}
                className="border-neutral-700 data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800"
              />
              <Label htmlFor="same-billing" className="text-neutral-300">Billing address same as shipping address</Label>
            </div>
            
            {!sameBillingAddress && (
              <div>
                <Label htmlFor="billing-address" className="text-neutral-300">Billing Address</Label>
                <Textarea
                  id="billing-address"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  placeholder="Full billing address"
                  rows={3}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax-id" className="text-neutral-300">Tax ID #</Label>
              <Input
                id="tax-id"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="Tax ID Number"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
              />
            </div>
            
            <div>
              <Label htmlFor="business-type" className="text-neutral-300">Type of Business</Label>
              <Select value={formData.businessType} onValueChange={(value) => handleSelectChange('businessType', value)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="LLC" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">LLC</SelectItem>
                  <SelectItem value="Partnership" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Partnership</SelectItem>
                  <SelectItem value="Corporation" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Corporation</SelectItem>
                  <SelectItem value="Proprietorship" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Proprietorship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="payment-terms" className="text-neutral-300">Payment Terms</Label>
            <Select value={formData.paymentTerms} onValueChange={(value) => handleSelectChange('paymentTerms', value)}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="ACH Payments" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">ACH Payments</SelectItem>
                <SelectItem value="Credit Card" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Credit Card</SelectItem>
                <SelectItem value="COD Cash" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">COD Cash</SelectItem>
                <SelectItem value="Net Terms" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Net Terms</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="resale-certificate" className="text-slate-300">Resale Certificate (Optional)</Label>
            <div className="mt-2">
              {formData.resaleCertificateFile ? (
                <div className="flex items-center justify-between p-3 bg-slate-700 border border-slate-600 rounded-md">
                  <span className="text-sm text-slate-300">{formData.resaleCertificateFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="resale-certificate"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-300">
                        <span className="font-semibold">Click to upload</span> resale certificate
                      </p>
                      <p className="text-xs text-slate-400">PDF, PNG, JPG (MAX. 10MB)</p>
                    </div>
                    <input
                      id="resale-certificate"
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={loading || uploadingFile || !selectedWarehouse} 
              className="gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              {loading ? "Adding..." : uploadingFile ? "Uploading..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
