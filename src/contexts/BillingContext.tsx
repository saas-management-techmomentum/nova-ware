
import React, { createContext, useContext, ReactNode } from 'react';
import { useWarehouseScopedBilling, BillingRate, Invoice } from '@/hooks/useWarehouseScopedBilling';
import { CreateInvoiceData, InventoryValidationResult } from '@/types/billing';

interface BillingContextType {
  billingRates: BillingRate[];
  invoices: Invoice[];
  isLoading: boolean;
  addBillingRate: (rateData: Omit<BillingRate, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'warehouse_id'>) => Promise<BillingRate | null>;
  addInvoice: (invoiceData: CreateInvoiceData) => Promise<Invoice | null>;
  updateInvoiceStatus: (invoiceId: string, status: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled') => Promise<void>;
  createRecurringInvoice: (recurringData: any) => Promise<any>;
  validateInventoryAvailability: (items: { product_id: string; quantity: number }[]) => Promise<InventoryValidationResult>;
  generateInvoicePDF: (invoiceId: string) => Promise<string | undefined>;
  sendInvoiceEmail: (invoiceId: string, recipientEmail: string, customMessage?: string) => Promise<any>;
  createPaymentLink: (invoiceId: string) => Promise<string | undefined>;
  refetch: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const billingData = useWarehouseScopedBilling();

  return (
    <BillingContext.Provider value={billingData}>
      {children}
    </BillingContext.Provider>
  );
};
