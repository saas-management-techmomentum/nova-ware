import React, { useState, useEffect } from 'react';
import { Building, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClients } from '@/contexts/ClientsContext';
import { type Client } from '@/hooks/useWarehouseScopedClients';

interface EditClientDialogProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const businessTypes = [
  'Retail',
  'Wholesale', 
  'Manufacturing',
  'Distribution',
  'E-commerce',
  'Restaurant',
  'Healthcare',
  'Education',
  'Non-profit',
  'Government',
  'Other'
];

const paymentTermsOptions = [
  'Net 15',
  'Net 30', 
  'Net 45',
  'Net 60',
  'Due on Receipt',
  'Cash on Delivery',
  'Prepaid'
];

const EditClientDialog: React.FC<EditClientDialogProps> = ({ client, isOpen, onClose }) => {
  const { toast } = useToast();
  const { updateClient } = useClients();
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    shipping_address: '',
    billing_address: '',
    business_type: '',
    payment_terms: '',
    tax_id: ''
  });
  
  const [resaleFile, setResaleFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || '',
        contact_person: client.contact_person || '',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        shipping_address: client.shipping_address || '',
        billing_address: client.billing_address || '',
        business_type: client.business_type || '',
        payment_terms: client.payment_terms || '',
        tax_id: client.tax_id || ''
      });
      setResaleFile(null);
    }
  }, [client, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResaleFile(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.contact_email.trim()) {
      toast({
        title: "Validation Error", 
        description: "Contact email is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.contact_phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Contact phone is required", 
        variant: "destructive"
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!client || !validateForm()) return;

    setIsLoading(true);
    try {
      // For now, we'll just update the basic client data
      // File upload functionality would need to be implemented separately
      await updateClient(client.id, formData);
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      shipping_address: '',
      billing_address: '',
      business_type: '',
      payment_terms: '',
      tax_id: ''
    });
    setResaleFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-400" />
            Edit Client
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Update client information and business details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Company Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_person" className="text-slate-300">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter contact person"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email" className="text-slate-300">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone" className="text-slate-300">Contact Phone *</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Address Information</h3>
            
            <div>
              <Label htmlFor="shipping_address" className="text-slate-300">Shipping Address</Label>
              <Textarea
                id="shipping_address"
                value={formData.shipping_address}
                onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                placeholder="Enter shipping address"
              />
            </div>
            
            <div>
              <Label htmlFor="billing_address" className="text-slate-300">Billing Address</Label>
              <Textarea
                id="billing_address"
                value={formData.billing_address}
                onChange={(e) => handleInputChange('billing_address', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                placeholder="Enter billing address (leave empty to use shipping address)"
              />
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Business Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_type" className="text-slate-300">Business Type</Label>
                <Select value={formData.business_type} onValueChange={(value) => handleInputChange('business_type', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="payment_terms" className="text-slate-300">Payment Terms</Label>
                <Select value={formData.payment_terms} onValueChange={(value) => handleInputChange('payment_terms', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {paymentTermsOptions.map((term) => (
                      <SelectItem key={term} value={term} className="text-white hover:bg-slate-700">
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tax_id" className="text-slate-300">Tax ID</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter tax ID"
              />
            </div>
          </div>

          {/* Resale Certificate */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Resale Certificate</h3>
            {client && 'resale_certificate_url' in client && client.resale_certificate_url && (
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 mb-2">Current certificate:</p>
                <a 
                  href={client.resale_certificate_url as string} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-300 underline text-sm"
                >
                  View current certificate
                </a>
              </div>
            )}
            
            <div>
              <Label htmlFor="resale_certificate" className="text-slate-300">Upload New Certificate</Label>
              <div className="mt-2">
                <Input
                  id="resale_certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="bg-slate-800 border-slate-700 text-white file:bg-gray-700 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                />
                <p className="text-xs text-slate-400 mt-1">Supported formats: PDF, JPG, PNG (max 10MB)</p>
              </div>
              
              {resaleFile && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700">
                  <Upload className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-white">{resaleFile.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setResaleFile(null)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gray-800 hover:bg-gray-900"
          >
            {isLoading ? 'Updating...' : 'Update Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;