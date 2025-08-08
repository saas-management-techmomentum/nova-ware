
export interface CreateInvoiceData {
  invoice_number: string;
  client_id: string;
  // New: Client snapshot data for historical integrity
  client_name: string;
  client_billing_address?: string;
  client_contact_email: string;
  client_contact_phone: string;
  client_payment_terms_days: number;
  invoice_date: string;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  template_id?: string | null;
  items: CreateInvoiceItemData[];
}

export interface CreateInvoiceItemData {
  product_id: string;
  sku: string;
  name: string;
  // New: Product description snapshot for historical integrity
  product_description?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  // New: Stock level at time of invoice creation for historical tracking
  stock_at_creation: number;
}

export interface InventoryValidationResult {
  valid: boolean;
  total_shortage: number;
  items: {
    product_id: string;
    available: boolean;
    current_stock: number;
    requested_quantity: number;
    shortage: number;
    product_name: string;
    sku: string;
  }[];
  error?: string;
}
