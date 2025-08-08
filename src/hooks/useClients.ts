
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  shippingAddress: string;
  billingAddress: string | null;
  taxId: string;
  businessType: 'LLC' | 'Partnership' | 'Corporation' | 'Proprietorship';
  paymentTerms: 'ACH Payments' | 'Credit Card' | 'COD Cash' | 'Net Terms';
  resaleCertificateUrl: string | null;
}

export const useClients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the Client interface
      const transformedClients: Client[] = data.map(client => ({
        id: client.id,
        name: client.name,
        contactPerson: client.contact_person || '',
        contactEmail: client.contact_email || '',
        contactPhone: client.contact_phone || '',
        shippingAddress: client.shipping_address || '',
        billingAddress: client.billing_address,
        taxId: client.tax_id || '',
        businessType: client.business_type as 'LLC' | 'Partnership' | 'Corporation' | 'Proprietorship',
        paymentTerms: client.payment_terms as 'ACH Payments' | 'Credit Card' | 'COD Cash' | 'Net Terms',
        resaleCertificateUrl: client.resale_certificate_url,
      }));

      setClients(transformedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = (client: { id: string, name: string }) => {
    // Refresh the clients list after adding
    fetchClients();
  };

  const deleteClient = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));
      
      toast({
        title: "Client Removed",
        description: "Client has been removed successfully",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  return {
    clients,
    loading,
    fetchClients,
    addClient,
    deleteClient,
  };
};
