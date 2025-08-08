
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/contexts/ClientsContext';
import { useToast } from '@/hooks/use-toast';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    billing_address: '',
    shipping_address: '',
    business_type: '',
    tax_id: '',
    payment_terms: '',
    payment_terms_days: 0, // New field for payment terms in days
    resale_certificate_url: '',
  });

  const { addClient } = useClients();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addClient(formData);
      
      toast({
        title: "Success",
        description: "Client added successfully",
      });
      
      setFormData({
        name: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        billing_address: '',
        shipping_address: '',
        business_type: '',
        tax_id: '',
        payment_terms: '',
        payment_terms_days: 0,
        resale_certificate_url: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      });
    }
  };

  const handlePaymentTermsChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      payment_terms: value,
      payment_terms_days: value === 'net_30' ? 30 : value === 'net_15' ? 15 : value === 'net_60' ? 60 : 0
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contact_person" className="text-slate-300">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <Label htmlFor="contact_email" className="text-slate-300">Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contact_phone" className="text-slate-300">Phone *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="billing_address" className="text-slate-300">Billing Address</Label>
              <Textarea
                id="billing_address"
                value={formData.billing_address}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                rows={2}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="shipping_address" className="text-slate-300">Shipping Address</Label>
              <Textarea
                id="shipping_address"
                value={formData.shipping_address}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="business_type" className="text-slate-300">Business Type</Label>
              <Select value={formData.business_type} onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="retail" className="text-white hover:bg-slate-700 focus:bg-slate-700">Retail</SelectItem>
                  <SelectItem value="wholesale" className="text-white hover:bg-slate-700 focus:bg-slate-700">Wholesale</SelectItem>
                  <SelectItem value="distributor" className="text-white hover:bg-slate-700 focus:bg-slate-700">Distributor</SelectItem>
                  <SelectItem value="manufacturer" className="text-white hover:bg-slate-700 focus:bg-slate-700">Manufacturer</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-slate-700 focus:bg-slate-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment_terms" className="text-slate-300">Payment Terms</Label>
              <Select value={formData.payment_terms} onValueChange={handlePaymentTermsChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="immediate" className="text-white hover:bg-slate-700 focus:bg-slate-700">Immediate Payment (No Net Terms)</SelectItem>
                  <SelectItem value="net_15" className="text-white hover:bg-slate-700 focus:bg-slate-700">Net 15 Days</SelectItem>
                  <SelectItem value="net_30" className="text-white hover:bg-slate-700 focus:bg-slate-700">Net 30 Days</SelectItem>
                  <SelectItem value="net_60" className="text-white hover:bg-slate-700 focus:bg-slate-700">Net 60 Days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                {formData.payment_terms_days === 0 
                  ? "Orders created when invoice is paid" 
                  : `Orders created when invoice is approved (${formData.payment_terms_days} day terms)`
                }
              </p>
            </div>
            
            <div>
              <Label htmlFor="tax_id" className="text-slate-300">Tax ID</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <Label htmlFor="resale_certificate_url" className="text-slate-300">Resale Certificate URL</Label>
              <Input
                id="resale_certificate_url"
                value={formData.resale_certificate_url}
                onChange={(e) => setFormData(prev => ({ ...prev, resale_certificate_url: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                placeholder="https://"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Add Client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
