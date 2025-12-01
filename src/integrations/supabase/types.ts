export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type_id: string | null
          company_id: string | null
          created_at: string | null
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type_id?: string | null
          company_id?: string | null
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type_id?: string | null
          company_id?: string | null
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_account_type_id_fkey"
            columns: ["account_type_id"]
            isOneToOne: false
            referencedRelation: "account_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string
          account_type: string | null
          bank_name: string
          company_id: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          last_reconciled_date: string | null
          plaid_access_token: string | null
          plaid_item_id: string | null
          routing_number: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          account_number: string
          account_type?: string | null
          bank_name: string
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          last_reconciled_date?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          routing_number?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          account_number?: string
          account_type?: string | null
          bank_name?: string
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          last_reconciled_date?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          routing_number?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          matched_entry_id: string | null
          plaid_transaction_id: string | null
          status: string | null
          transaction_date: string
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          matched_entry_id?: string | null
          plaid_transaction_id?: string | null
          status?: string | null
          transaction_date: string
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          matched_entry_id?: string | null
          plaid_transaction_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_allocations: {
        Row: {
          allocated_at: string | null
          allocation_strategy: string
          batch_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          order_id: string | null
          order_item_id: string | null
          product_id: string | null
          quantity: number
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          allocated_at?: string | null
          allocation_strategy: string
          batch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          quantity: number
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          allocated_at?: string | null
          allocation_strategy?: string
          batch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          quantity?: number
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_allocations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rates: {
        Row: {
          client_id: string | null
          company_id: string | null
          created_at: string | null
          effective_date: string
          end_date: string | null
          id: string
          rate_amount: number
          rate_type: string
          service_type: string
          unit: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string | null
          effective_date: string
          end_date?: string | null
          id?: string
          rate_amount: number
          rate_type: string
          service_type: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string | null
          effective_date?: string
          end_date?: string | null
          id?: string
          rate_amount?: number
          rate_type?: string
          service_type?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_rates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_rates_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string | null
          description: string
          id: string
          reference: string | null
          status: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id: string
          created_at?: string | null
          description: string
          id?: string
          reference?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string | null
          description?: string
          id?: string
          reference?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_address: string | null
          business_type: string | null
          company_id: string | null
          contact_email: string
          contact_person: string | null
          contact_phone: string
          created_at: string | null
          id: string
          name: string
          payment_terms: string | null
          payment_terms_days: number | null
          resale_certificate_url: string | null
          shipping_address: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          billing_address?: string | null
          business_type?: string | null
          company_id?: string | null
          contact_email: string
          contact_person?: string | null
          contact_phone: string
          created_at?: string | null
          id?: string
          name: string
          payment_terms?: string | null
          payment_terms_days?: number | null
          resale_certificate_url?: string | null
          shipping_address?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          billing_address?: string | null
          business_type?: string | null
          company_id?: string | null
          contact_email?: string
          contact_person?: string | null
          contact_phone?: string
          created_at?: string | null
          id?: string
          name?: string
          payment_terms?: string | null
          payment_terms_days?: number | null
          resale_certificate_url?: string | null
          shipping_address?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string | null
          id: string
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          annual_salary: number | null
          assigned_warehouse_id: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          dental_insurance_amount: number | null
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          health_insurance_amount: number | null
          hourly_rate: number | null
          id: string
          initials: string | null
          invited_at: string | null
          name: string
          needs_password_change: boolean | null
          other_deductions_amount: number | null
          page_permissions: Json | null
          pay_type: string | null
          phone: string | null
          position: string | null
          retirement_401k_amount: number | null
          role: string | null
          start_date: string | null
          status: string | null
          tax_withholding_status: string | null
          updated_at: string | null
          user_id: string
          user_id_auth: string | null
        }
        Insert: {
          address?: string | null
          annual_salary?: number | null
          assigned_warehouse_id?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          dental_insurance_amount?: number | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          health_insurance_amount?: number | null
          hourly_rate?: number | null
          id?: string
          initials?: string | null
          invited_at?: string | null
          name: string
          needs_password_change?: boolean | null
          other_deductions_amount?: number | null
          page_permissions?: Json | null
          pay_type?: string | null
          phone?: string | null
          position?: string | null
          retirement_401k_amount?: number | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          tax_withholding_status?: string | null
          updated_at?: string | null
          user_id: string
          user_id_auth?: string | null
        }
        Update: {
          address?: string | null
          annual_salary?: number | null
          assigned_warehouse_id?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          dental_insurance_amount?: number | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          health_insurance_amount?: number | null
          hourly_rate?: number | null
          id?: string
          initials?: string | null
          invited_at?: string | null
          name?: string
          needs_password_change?: boolean | null
          other_deductions_amount?: number | null
          page_permissions?: Json | null
          pay_type?: string | null
          phone?: string | null
          position?: string | null
          retirement_401k_amount?: number | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          tax_withholding_status?: string | null
          updated_at?: string | null
          user_id?: string
          user_id_auth?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_assigned_warehouse_id_fkey"
            columns: ["assigned_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference: string | null
          remaining_stock: number | null
          transaction_type: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference?: string | null
          remaining_stock?: number | null
          transaction_type: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference?: string | null
          remaining_stock?: number | null
          transaction_type?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_emails: {
        Row: {
          error_message: string | null
          id: string
          invoice_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_emails_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string | null
          name: string
          product_description: string | null
          product_id: string | null
          quantity: number
          sku: string
          stock_at_creation: number | null
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          name: string
          product_description?: string | null
          product_id?: string | null
          quantity: number
          sku: string
          stock_at_creation?: number | null
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          name?: string
          product_description?: string | null
          product_id?: string | null
          quantity?: number
          sku?: string
          stock_at_creation?: number | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string | null
          name: string
          product_id: string | null
          quantity: number
          sku: string
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          name: string
          product_id?: string | null
          quantity: number
          sku: string
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          name?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          design_config: Json | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          design_config?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          design_config?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_templates_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          client_billing_address: string | null
          client_contact_email: string | null
          client_contact_phone: string | null
          client_id: string | null
          client_name: string | null
          client_payment_terms_days: number | null
          company_id: string | null
          created_at: string | null
          due_date: string
          email_sent_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          payment_date: string | null
          payment_due_reminder_sent_at: string | null
          payment_link: string | null
          pdf_url: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          template_id: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          client_billing_address?: string | null
          client_contact_email?: string | null
          client_contact_phone?: string | null
          client_id?: string | null
          client_name?: string | null
          client_payment_terms_days?: number | null
          company_id?: string | null
          created_at?: string | null
          due_date: string
          email_sent_at?: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          payment_date?: string | null
          payment_due_reminder_sent_at?: string | null
          payment_link?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          template_id?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          client_billing_address?: string | null
          client_contact_email?: string | null
          client_contact_phone?: string | null
          client_id?: string | null
          client_name?: string | null
          client_payment_terms_days?: number | null
          company_id?: string | null
          created_at?: string | null
          due_date?: string
          email_sent_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          payment_date?: string | null
          payment_due_reminder_sent_at?: string | null
          payment_link?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          entry_number: string
          id: string
          reference: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          entry_number: string
          id?: string
          reference?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          reference?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      order_documents: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          order_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          sku: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          sku: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          sku?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          id: string
          name: string
          order_index: number
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          order_index?: number
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_statuses_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_workflows: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          order_id: string
          picking_strategy: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          picking_strategy?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          picking_strategy?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_workflows_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_workflows_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          carrier: string | null
          company_id: string | null
          created_at: string | null
          customer_name: string
          id: string
          invoice_id: string | null
          invoice_number: string | null
          ship_date: string | null
          shipment_status: string | null
          shipping_address: string | null
          shipping_method: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          carrier?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          ship_date?: string | null
          shipment_status?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          carrier?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          ship_date?: string | null
          shipment_status?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      pallet_locations: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          location: string
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id: string
          location: string
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          location?: string
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pallet_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      pallet_products: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          pallet_id: string | null
          product_id: string | null
          quantity: number
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          pallet_id?: string | null
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          pallet_id?: string | null
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pallet_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_products_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "pallet_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_products_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          bonus_amount: number | null
          company_id: string | null
          created_at: string | null
          dental_insurance: number | null
          employee_id: string
          federal_tax: number | null
          gross_pay: number
          health_insurance: number | null
          hourly_rate: number
          hours_worked: number
          id: string
          medicare: number | null
          net_pay: number
          notes: string | null
          other_deductions: number | null
          overtime_hours: number | null
          overtime_rate: number | null
          pay_date: string | null
          pay_period_end: string
          pay_period_start: string
          retirement_401k: number | null
          social_security: number | null
          state_tax: number | null
          status: string | null
          total_deductions: number | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          bonus_amount?: number | null
          company_id?: string | null
          created_at?: string | null
          dental_insurance?: number | null
          employee_id: string
          federal_tax?: number | null
          gross_pay?: number
          health_insurance?: number | null
          hourly_rate?: number
          hours_worked?: number
          id?: string
          medicare?: number | null
          net_pay?: number
          notes?: string | null
          other_deductions?: number | null
          overtime_hours?: number | null
          overtime_rate?: number | null
          pay_date?: string | null
          pay_period_end: string
          pay_period_start: string
          retirement_401k?: number | null
          social_security?: number | null
          state_tax?: number | null
          status?: string | null
          total_deductions?: number | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          bonus_amount?: number | null
          company_id?: string | null
          created_at?: string | null
          dental_insurance?: number | null
          employee_id?: string
          federal_tax?: number | null
          gross_pay?: number
          health_insurance?: number | null
          hourly_rate?: number
          hours_worked?: number
          id?: string
          medicare?: number | null
          net_pay?: number
          notes?: string | null
          other_deductions?: number | null
          overtime_hours?: number | null
          overtime_rate?: number | null
          pay_date?: string | null
          pay_period_end?: string
          pay_period_start?: string
          retirement_401k?: number | null
          social_security?: number | null
          state_tax?: number | null
          status?: string | null
          total_deductions?: number | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_entries: {
        Row: {
          amount: number
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string
          id: string
          receipt_url: string | null
          transaction_date: string
          transaction_type: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          receipt_url?: string | null
          transaction_date: string
          transaction_type?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          receipt_url?: string | null
          transaction_date?: string
          transaction_type?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_entries_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      po_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          item_sku: string
          po_id: string | null
          product_id: string | null
          quantity: number
          received_quantity: number | null
          subtotal: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          item_sku: string
          po_id?: string | null
          product_id?: string | null
          quantity: number
          received_quantity?: number | null
          subtotal: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          item_sku?: string
          po_id?: string | null
          product_id?: string | null
          quantity?: number
          received_quantity?: number | null
          subtotal?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          company_id: string | null
          cost_price: number | null
          created_at: string | null
          expiration_date: string | null
          id: string
          location_id: string | null
          location_name: string | null
          notes: string | null
          product_id: string | null
          quantity: number
          received_date: string | null
          supplier_reference: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          batch_number: string
          company_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          received_date?: string | null
          supplier_reference?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          batch_number?: string
          company_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          received_date?: string | null
          supplier_reference?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          asin: string | null
          case_cost: number | null
          case_price: number | null
          casesize: string | null
          category: string | null
          company_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          dimensions: string | null
          expiration: string | null
          has_batches: boolean | null
          id: string
          image_url: string | null
          location: string | null
          low_stock_threshold: number | null
          name: string
          quantity: number | null
          sku: string
          stock: number | null
          unit_price: number | null
          upc: string | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
          weight: string | null
        }
        Insert: {
          asin?: string | null
          case_cost?: number | null
          case_price?: number | null
          casesize?: string | null
          category?: string | null
          company_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          expiration?: string | null
          has_batches?: boolean | null
          id?: string
          image_url?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          name: string
          quantity?: number | null
          sku: string
          stock?: number | null
          unit_price?: number | null
          upc?: string | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
          weight?: string | null
        }
        Update: {
          asin?: string | null
          case_cost?: number | null
          case_price?: number | null
          casesize?: string | null
          category?: string | null
          company_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          expiration?: string | null
          has_batches?: boolean | null
          id?: string
          image_url?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          name?: string
          quantity?: number | null
          sku?: string
          stock?: number | null
          unit_price?: number | null
          upc?: string | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          location: string | null
          onboarding_completed: boolean | null
          onboarding_current_step: number | null
          onboarding_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_current_step?: number | null
          onboarding_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_current_step?: number | null
          onboarding_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          company_id: string | null
          created_at: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
          vendor_contact: string | null
          vendor_email: string | null
          vendor_name: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date: string
          po_number: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
          vendor_contact?: string | null
          vendor_email?: string | null
          vendor_name: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          vendor_contact?: string | null
          vendor_email?: string | null
          vendor_name?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          client_id: string | null
          company_id: string | null
          created_at: string | null
          end_date: string | null
          frequency: string
          id: string
          interval_count: number | null
          is_active: boolean | null
          next_invoice_date: string
          template_data: Json
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_count?: number | null
          is_active?: boolean | null
          next_invoice_date: string
          template_data: Json
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_count?: number | null
          is_active?: boolean | null
          next_invoice_date?: string
          template_data?: Json
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          created_at: string | null
          damaged_qty: number | null
          expected_qty: number
          id: string
          name: string
          notes: string | null
          received_qty: number | null
          shipment_id: string | null
          sku: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          damaged_qty?: number | null
          expected_qty: number
          id?: string
          name: string
          notes?: string | null
          received_qty?: number | null
          shipment_id?: string | null
          sku: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          damaged_qty?: number | null
          expected_qty?: number
          id?: string
          name?: string
          notes?: string | null
          received_qty?: number | null
          shipment_id?: string | null
          sku?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          company_id: string | null
          created_at: string | null
          expected_date: string
          id: string
          order_id: string | null
          order_reference: string
          received_date: string | null
          shipment_type: string | null
          source_po_id: string | null
          status: string | null
          supplier: string
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expected_date: string
          id?: string
          order_id?: string | null
          order_reference: string
          received_date?: string | null
          shipment_type?: string | null
          source_po_id?: string | null
          status?: string | null
          supplier: string
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expected_date?: string
          id?: string
          order_id?: string | null
          order_reference?: string
          received_date?: string | null
          shipment_type?: string | null
          source_po_id?: string | null
          status?: string | null
          supplier?: string
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      task_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_state: Json | null
          previous_state: Json | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_paused: boolean | null
          pause_time: string | null
          priority: string | null
          resume_time: string | null
          start_time: string | null
          status: string | null
          time_tracking_status: string | null
          title: string
          total_duration: number | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_paused?: boolean | null
          pause_time?: string | null
          priority?: string | null
          resume_time?: string | null
          start_time?: string | null
          status?: string | null
          time_tracking_status?: string | null
          title: string
          total_duration?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_paused?: boolean | null
          pause_time?: string | null
          priority?: string | null
          resume_time?: string | null
          start_time?: string | null
          status?: string | null
          time_tracking_status?: string | null
          title?: string
          total_duration?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bill_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          user_id: string
          vendor_bill_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          user_id: string
          vendor_bill_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          user_id?: string
          vendor_bill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bill_payments_vendor_bill_id_fkey"
            columns: ["vendor_bill_id"]
            isOneToOne: false
            referencedRelation: "vendor_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bills: {
        Row: {
          amount: number
          bill_number: string
          company_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          po_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          vendor_name: string
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          bill_number: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          issue_date: string
          notes?: string | null
          po_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          vendor_name: string
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          bill_number?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          po_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          vendor_name?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          status: string
          transaction_date: string
          transaction_type: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status: string
          transaction_date: string
          transaction_type: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          transaction_date?: string
          transaction_type?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          company_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string | null
          user_id: string
          vendor_name: string
          warehouse_id: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id: string
          vendor_name: string
          warehouse_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string
          vendor_name?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_users: {
        Row: {
          access_level: string | null
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_users_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          company_id: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          actual_time: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          estimated_time: number | null
          id: string
          started_at: string | null
          status: string | null
          step_name: string
          workflow_id: string
        }
        Insert: {
          actual_time?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          estimated_time?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          step_name: string
          workflow_id: string
        }
        Update: {
          actual_time?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          estimated_time?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          step_name?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "order_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_employee_after_password_change: {
        Args: { employee_user_id: string }
        Returns: boolean
      }
      allocate_and_deduct_inventory: {
        Args: {
          p_company_id: string
          p_order_id: string
          p_order_item_id: string
          p_product_id: string
          p_quantity: number
          p_strategy: string
          p_user_id: string
          p_warehouse_id: string
        }
        Returns: {
          allocated_qty: number
          allocation_id: string
          batch_id: string
          batch_number: string
          location_name: string
        }[]
      }
      allocate_inventory_fefo: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_warehouse_id?: string
        }
        Returns: {
          allocated_qty: number
          batch_id: string
          batch_number: string
          location_name: string
        }[]
      }
      allocate_inventory_fifo: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_warehouse_id?: string
        }
        Returns: {
          allocated_qty: number
          batch_id: string
          batch_number: string
          location_name: string
        }[]
      }
      allocate_inventory_lifo: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_warehouse_id?: string
        }
        Returns: {
          allocated_qty: number
          batch_id: string
          batch_number: string
          location_name: string
        }[]
      }
      assign_employee_to_warehouse: {
        Args: { employee_uuid: string; warehouse_uuid: string }
        Returns: boolean
      }
      calculate_warehouse_metrics_enhanced: {
        Args: { warehouse_uuid?: string }
        Returns: Json
      }
      complete_user_setup: {
        Args: { company_name: string; target_user_id: string }
        Returns: Json
      }
      fix_existing_invoice_inventory: {
        Args: { invoice_uuid: string }
        Returns: Json
      }
      fix_incomplete_user_setup: {
        Args: { target_user_id: string }
        Returns: Json
      }
      generate_batch_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      get_accessible_warehouses:
        | { Args: { user_uuid: string }; Returns: string[] }
        | {
            Args: never
            Returns: {
              access_level: string
              company_id: string
              warehouse_code: string
              warehouse_id: string
              warehouse_name: string
            }[]
          }
      get_employee_assigned_warehouse: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_company_ids: { Args: { user_uuid: string }; Returns: string[] }
      get_user_data_scope: { Args: { p_user_id?: string }; Returns: Json }
      get_user_task_metrics: { Args: { user_uuid: string }; Returns: Json }
      has_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { comp_id: string; user_uuid: string }
        Returns: boolean
      }
      safe_assign_user_to_warehouse: {
        Args: {
          p_access_level?: string
          p_user_id: string
          p_warehouse_id: string
        }
        Returns: boolean
      }
      user_needs_password_change: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "employee", "viewer"],
    },
  },
} as const
