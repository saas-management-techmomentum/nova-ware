export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type_id: string
          company_id: string | null
          created_at: string
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean
          opening_balance: number | null
          parent_account_id: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type_id: string
          company_id?: string | null
          created_at?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type_id?: string
          company_id?: string | null
          created_at?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string
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
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
          account_type: string
          bank_name: string
          company_id: string | null
          created_at: string
          currency: string
          current_balance: number
          id: string
          is_active: boolean
          last_sync: string | null
          opening_balance: number
          plaid_access_token: string | null
          plaid_account_id: string | null
          plaid_item_id: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          account_number: string
          account_type?: string
          bank_name: string
          company_id?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          last_sync?: string | null
          opening_balance?: number
          plaid_access_token?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          account_number?: string
          account_type?: string
          bank_name?: string
          company_id?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          last_sync?: string | null
          opening_balance?: number
          plaid_access_token?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          category: string | null
          created_at: string
          description: string
          gl_reference_id: string | null
          id: string
          plaid_transaction_id: string | null
          reference_number: string | null
          status: string
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          category?: string | null
          created_at?: string
          description: string
          gl_reference_id?: string | null
          id?: string
          plaid_transaction_id?: string | null
          reference_number?: string | null
          status?: string
          transaction_date: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          category?: string | null
          created_at?: string
          description?: string
          gl_reference_id?: string | null
          id?: string
          plaid_transaction_id?: string | null
          reference_number?: string | null
          status?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bank_transactions_bank_account"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bank_transactions_journal_entry"
            columns: ["gl_reference_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rates: {
        Row: {
          client_id: string
          created_at: string
          effective_date: string
          end_date: string | null
          id: string
          rate_amount: number
          rate_type: string
          service_type: string
          unit: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          effective_date: string
          end_date?: string | null
          id?: string
          rate_amount: number
          rate_type: string
          service_type: string
          unit?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          effective_date?: string
          end_date?: string | null
          id?: string
          rate_amount?: number
          rate_type?: string
          service_type?: string
          unit?: string | null
          updated_at?: string
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
          client_id: string
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          quantity: number
          rate_amount: number
          reference_id: string | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          unit: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          quantity: number
          rate_amount: number
          reference_id?: string | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          unit: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          quantity?: number
          rate_amount?: number
          reference_id?: string | null
          total_amount?: number
          transaction_date?: string
          transaction_type?: string
          unit?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
          created_at: string
          id: string
          name: string
          payment_terms: string | null
          payment_terms_days: number | null
          resale_certificate_url: string | null
          shipping_address: string | null
          tax_id: string | null
          updated_at: string
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
          created_at?: string
          id?: string
          name: string
          payment_terms?: string | null
          payment_terms_days?: number | null
          resale_certificate_url?: string | null
          shipping_address?: string | null
          tax_id?: string | null
          updated_at?: string
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
          created_at?: string
          id?: string
          name?: string
          payment_terms?: string | null
          payment_terms_days?: number | null
          resale_certificate_url?: string | null
          shipping_address?: string | null
          tax_id?: string | null
          updated_at?: string
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
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          approval_requested_at: string | null
          approval_status: string | null
          approval_token: string | null
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_requested_at?: string | null
          approval_status?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          permissions?: Json | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_requested_at?: string | null
          approval_status?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
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
          assigned_warehouse_id: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
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
          updated_at: string
          user_id: string
          user_id_auth: string | null
        }
        Insert: {
          address?: string | null
          assigned_warehouse_id?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
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
          updated_at?: string
          user_id: string
          user_id_auth?: string | null
        }
        Update: {
          address?: string | null
          assigned_warehouse_id?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
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
          updated_at?: string
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
        ]
      }
      inventory_history: {
        Row: {
          batch_expiration_date: string | null
          batch_id: string | null
          client_id: string | null
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference: string | null
          remaining_stock: number
          transaction_type: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          batch_expiration_date?: string | null
          batch_id?: string | null
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference?: string | null
          remaining_stock: number
          transaction_type: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          batch_expiration_date?: string | null
          batch_id?: string | null
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference?: string | null
          remaining_stock?: number
          transaction_type?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      inventory_valuations: {
        Row: {
          adjustment_amount: number
          adjustment_reason: string | null
          created_at: string
          id: string
          journal_entry_id: string | null
          new_total_value: number
          new_unit_cost: number
          previous_total_value: number
          previous_unit_cost: number
          product_id: string
          quantity_on_hand: number
          updated_at: string
          user_id: string
          valuation_date: string
        }
        Insert: {
          adjustment_amount?: number
          adjustment_reason?: string | null
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          new_total_value?: number
          new_unit_cost?: number
          previous_total_value?: number
          previous_unit_cost?: number
          product_id: string
          quantity_on_hand?: number
          updated_at?: string
          user_id: string
          valuation_date?: string
        }
        Update: {
          adjustment_amount?: number
          adjustment_reason?: string | null
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          new_total_value?: number
          new_unit_cost?: number
          previous_total_value?: number
          previous_unit_cost?: number
          product_id?: string
          quantity_on_hand?: number
          updated_at?: string
          user_id?: string
          valuation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_valuations_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_valuations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_emails: {
        Row: {
          email_status: string
          email_type: string
          id: string
          invoice_id: string
          recipient_email: string
          sent_at: string
        }
        Insert: {
          email_status?: string
          email_type: string
          id?: string
          invoice_id: string
          recipient_email: string
          sent_at?: string
        }
        Update: {
          email_status?: string
          email_type?: string
          id?: string
          invoice_id?: string
          recipient_email?: string
          sent_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          name: string
          product_description: string | null
          product_id: string
          quantity: number
          sku: string
          stock_at_creation: number | null
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          name: string
          product_description?: string | null
          product_id: string
          quantity: number
          sku: string
          stock_at_creation?: number | null
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          name?: string
          product_description?: string | null
          product_id?: string
          quantity?: number
          sku?: string
          stock_at_creation?: number | null
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_items_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoice_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          service_type: string
          total_amount: number
          unit_rate: number
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity: number
          service_type: string
          total_amount: number
          unit_rate: number
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_type?: string
          total_amount?: number
          unit_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date: string
          payment_method: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
        }
        Relationships: []
      }
      invoice_templates: {
        Row: {
          created_at: string
          design_config: Json
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          design_config: Json
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          design_config?: Json
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
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
          billing_period_end: string
          billing_period_start: string
          client_billing_address: string | null
          client_contact_email: string | null
          client_contact_phone: string | null
          client_id: string
          client_name: string | null
          client_payment_terms_days: number | null
          created_at: string
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
          status: string
          subtotal: number
          tax_amount: number
          template_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          client_billing_address?: string | null
          client_contact_email?: string | null
          client_contact_phone?: string | null
          client_id: string
          client_name?: string | null
          client_payment_terms_days?: number | null
          created_at?: string
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
          status?: string
          subtotal?: number
          tax_amount?: number
          template_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          client_billing_address?: string | null
          client_contact_email?: string | null
          client_contact_phone?: string | null
          client_id?: string
          client_name?: string | null
          client_payment_terms_days?: number | null
          created_at?: string
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
          status?: string
          subtotal?: number
          tax_amount?: number
          template_id?: string | null
          total_amount?: number
          updated_at?: string
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
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string
          created_by: string
          description: string
          entry_date: string
          entry_number: string
          id: string
          module: string | null
          reference: string | null
          reference_id: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          description: string
          entry_date: string
          entry_number: string
          id?: string
          module?: string | null
          reference?: string | null
          reference_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          module?: string | null
          reference?: string | null
          reference_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
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
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number: number
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number
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
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          order_id: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          order_id: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          order_id?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          sku: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          quantity: number
          sku: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order_id"
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
          created_at: string
          id: string
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          order_index: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_workflows: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          order_id: string
          pallet_adjustments: Json | null
          picking_strategy: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          pallet_adjustments?: Json | null
          picking_strategy?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          pallet_adjustments?: Json | null
          picking_strategy?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          carrier: string | null
          company_id: string | null
          created_at: string
          customer_name: string
          id: string
          ship_date: string | null
          shipment_status: string | null
          shipping_address: string | null
          shipping_method: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          carrier?: string | null
          company_id?: string | null
          created_at?: string
          customer_name: string
          id: string
          ship_date?: string | null
          shipment_status?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          carrier?: string | null
          company_id?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          ship_date?: string | null
          shipment_status?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
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
          created_at: string
          id: string
          location: string
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id: string
          location: string
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          location?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
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
          created_at: string
          id: string
          pallet_id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pallet_id: string
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pallet_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
        ]
      }
      payment_methods: {
        Row: {
          client_id: string
          created_at: string
          details: Json | null
          id: string
          is_default: boolean
          method_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          details?: Json | null
          id?: string
          is_default?: boolean
          method_type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          is_default?: boolean
          method_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_entries: {
        Row: {
          company_id: string | null
          created_at: string
          dental_insurance: number
          department: string | null
          employee_id: string
          employee_name: string
          employee_position: string | null
          federal_tax: number
          gross_pay: number
          health_insurance: number
          hourly_rate: number
          hours_worked: number
          id: string
          medicare: number
          net_pay: number
          other_deductions: number
          overtime_hours: number
          overtime_rate: number
          pay_date: string | null
          pay_period_end: string
          pay_period_start: string
          retirement_401k: number
          social_security: number
          state_tax: number
          status: string
          total_deductions: number
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          dental_insurance?: number
          department?: string | null
          employee_id: string
          employee_name: string
          employee_position?: string | null
          federal_tax?: number
          gross_pay?: number
          health_insurance?: number
          hourly_rate?: number
          hours_worked?: number
          id?: string
          medicare?: number
          net_pay?: number
          other_deductions?: number
          overtime_hours?: number
          overtime_rate?: number
          pay_date?: string | null
          pay_period_end: string
          pay_period_start: string
          retirement_401k?: number
          social_security?: number
          state_tax?: number
          status?: string
          total_deductions?: number
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          dental_insurance?: number
          department?: string | null
          employee_id?: string
          employee_name?: string
          employee_position?: string | null
          federal_tax?: number
          gross_pay?: number
          health_insurance?: number
          hourly_rate?: number
          hours_worked?: number
          id?: string
          medicare?: number
          net_pay?: number
          other_deductions?: number
          overtime_hours?: number
          overtime_rate?: number
          pay_date?: string | null
          pay_period_end?: string
          pay_period_start?: string
          retirement_401k?: number
          social_security?: number
          state_tax?: number
          status?: string
          total_deductions?: number
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      petty_cash_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          reference_number: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          reference_number?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          reference_number?: string | null
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      po_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          item_sku: string
          po_id: string
          product_id: string | null
          quantity: number
          received_quantity: number
          subtotal: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          item_sku: string
          po_id: string
          product_id?: string | null
          quantity: number
          received_quantity?: number
          subtotal: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          item_sku?: string
          po_id?: string
          product_id?: string | null
          quantity?: number
          received_quantity?: number
          subtotal?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_po_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_po_items_purchase_order"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          company_id: string | null
          cost_price: number | null
          created_at: string
          expiration_date: string | null
          id: string
          location_id: string | null
          notes: string | null
          product_id: string
          quantity: number
          received_date: string
          supplier_reference: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          batch_number: string
          company_id?: string | null
          cost_price?: number | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          product_id: string
          quantity?: number
          received_date?: string
          supplier_reference?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          batch_number?: string
          company_id?: string | null
          cost_price?: number | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          received_date?: string
          supplier_reference?: string | null
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "pallet_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          created_at: string
          description: string | null
          dimensions: string | null
          expiration: string | null
          id: string
          image_url: string | null
          location: string | null
          low_stock_threshold: number | null
          name: string
          quantity: number
          sku: string
          unit_price: number | null
          upc: string | null
          updated_at: string
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
          created_at?: string
          description?: string | null
          dimensions?: string | null
          expiration?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          name: string
          quantity?: number
          sku: string
          unit_price?: number | null
          upc?: string | null
          updated_at?: string
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
          created_at?: string
          description?: string | null
          dimensions?: string | null
          expiration?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          name?: string
          quantity?: number
          sku?: string
          unit_price?: number | null
          upc?: string | null
          updated_at?: string
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
          created_at: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vendor_contact: string | null
          vendor_email: string | null
          vendor_name: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date: string
          po_number: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          vendor_contact?: string | null
          vendor_email?: string | null
          vendor_name: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_contact?: string | null
          vendor_email?: string | null
          vendor_name?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      recurring_invoices: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          frequency: string
          id: string
          interval_count: number
          is_active: boolean
          next_invoice_date: string
          start_date: string
          template_invoice_id: string
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          frequency: string
          id?: string
          interval_count?: number
          is_active?: boolean
          next_invoice_date: string
          start_date: string
          template_invoice_id: string
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          interval_count?: number
          is_active?: boolean
          next_invoice_date?: string
          start_date?: string
          template_invoice_id?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
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
          created_at: string
          damaged_qty: number | null
          expected_qty: number
          id: string
          name: string
          notes: string | null
          received_qty: number | null
          shipment_id: string
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          damaged_qty?: number | null
          expected_qty?: number
          id?: string
          name: string
          notes?: string | null
          received_qty?: number | null
          shipment_id: string
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          damaged_qty?: number | null
          expected_qty?: number
          id?: string
          name?: string
          notes?: string | null
          received_qty?: number | null
          shipment_id?: string
          sku?: string
          updated_at?: string
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
          carrier: string | null
          company_id: string | null
          created_at: string
          customer_name: string | null
          expected_date: string
          id: string
          order_reference: string
          received_date: string | null
          shipment_type: string | null
          shipping_address: string | null
          shipping_method: string | null
          source_order_id: string | null
          source_po_id: string | null
          status: string
          supplier: string
          tracking_number: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          carrier?: string | null
          company_id?: string | null
          created_at?: string
          customer_name?: string | null
          expected_date: string
          id?: string
          order_reference: string
          received_date?: string | null
          shipment_type?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          source_order_id?: string | null
          source_po_id?: string | null
          status?: string
          supplier: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          carrier?: string | null
          company_id?: string | null
          created_at?: string
          customer_name?: string | null
          expected_date?: string
          id?: string
          order_reference?: string
          received_date?: string | null
          shipment_type?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          source_order_id?: string | null
          source_po_id?: string | null
          status?: string
          supplier?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_source_po_id_fkey"
            columns: ["source_po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      task_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_state: Json | null
          previous_state: Json | null
          task_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          task_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          task_id?: string
          timestamp?: string
          user_id?: string
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
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_paused: boolean | null
          pause_time: string | null
          priority: string | null
          resume_time: string | null
          start_time: string | null
          status: string
          time_tracking_status: string | null
          title: string
          total_duration: number | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_paused?: boolean | null
          pause_time?: string | null
          priority?: string | null
          resume_time?: string | null
          start_time?: string | null
          status?: string
          time_tracking_status?: string | null
          title: string
          total_duration?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_paused?: boolean | null
          pause_time?: string | null
          priority?: string | null
          resume_time?: string | null
          start_time?: string | null
          status?: string
          time_tracking_status?: string | null
          title?: string
          total_duration?: number | null
          updated_at?: string
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
      user_picking_preferences: {
        Row: {
          created_at: string | null
          default_picking_strategy: string | null
          id: string
          optimize_pick_path: boolean | null
          show_pick_locations: boolean | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_picking_strategy?: string | null
          id?: string
          optimize_pick_path?: boolean | null
          show_pick_locations?: boolean | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_picking_strategy?: string | null
          id?: string
          optimize_pick_path?: boolean | null
          show_pick_locations?: boolean | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      vendor_bill_payments: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          reference_number: string | null
          user_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          reference_number?: string | null
          user_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "vendor_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bills: {
        Row: {
          amount: number
          attachment_url: string | null
          bill_number: string
          company_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          paid_amount: number
          po_id: string | null
          status: string
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_name: string
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          bill_number: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          issue_date: string
          notes?: string | null
          paid_amount?: number
          po_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_name: string
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          bill_number?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          po_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_name?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bills_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: string | null
          transaction_date: string
          transaction_type: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type: string
          user_id: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type?: string
          user_id?: string
          vendor_id?: string
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
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string
          user_id: string
          vendor_name: string
          warehouse_id: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
          vendor_name: string
          warehouse_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          vendor_name?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      warehouse_users: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string
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
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          phone: string | null
          picking_strategy: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          phone?: string | null
          picking_strategy?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          picking_strategy?: string | null
          state?: string | null
          updated_at?: string
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
      workflow_pick_instructions: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          pick_sequence: number
          product_id: string
          sku: string
          total_quantity: number
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          pick_sequence: number
          product_id: string
          sku: string
          total_quantity: number
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          pick_sequence?: number
          product_id?: string
          sku?: string
          total_quantity?: number
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_pick_instructions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_pick_instructions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_pick_locations: {
        Row: {
          created_at: string | null
          id: string
          pallet_id: string
          pallet_location: string
          pick_instruction_id: string
          pick_order: number
          quantity_to_pick: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          pallet_id: string
          pallet_location: string
          pick_instruction_id: string
          pick_order: number
          quantity_to_pick: number
        }
        Update: {
          created_at?: string | null
          id?: string
          pallet_id?: string
          pallet_location?: string
          pick_instruction_id?: string
          pick_order?: number
          quantity_to_pick?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_pick_locations_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "pallet_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_pick_locations_pick_instruction_id_fkey"
            columns: ["pick_instruction_id"]
            isOneToOne: false
            referencedRelation: "workflow_pick_instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          documents: Json | null
          id: string
          role_required: string | null
          started_at: string | null
          status: string
          step_name: string
          step_order: number
          updated_at: string
          workflow_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          role_required?: string | null
          started_at?: string | null
          status?: string
          step_name: string
          step_order: number
          updated_at?: string
          workflow_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          role_required?: string | null
          started_at?: string | null
          status?: string
          step_name?: string
          step_order?: number
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
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
        Returns: Json
      }
      allocate_inventory_fefo: {
        Args: {
          product_uuid: string
          required_quantity: number
          user_uuid: string
          warehouse_uuid?: string
        }
        Returns: {
          batch_id: string
          allocated_quantity: number
          expiration_date: string
        }[]
      }
      assign_user_to_company: {
        Args: {
          target_user_id: string
          target_company_id: string
          user_role?: string
        }
        Returns: boolean
      }
      assign_user_to_warehouse: {
        Args: {
          target_user_id: string
          target_warehouse_id: string
          warehouse_role?: string
        }
        Returns: boolean
      }
      audit_data_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_type: string
          issue_count: number
          details: string
        }[]
      }
      calculate_warehouse_metrics: {
        Args: Record<PropertyKey, never> | { warehouse_uuid?: string }
        Returns: Json
      }
      calculate_warehouse_metrics_enhanced: {
        Args: { warehouse_uuid?: string }
        Returns: Json
      }
      can_complete_workflow_step: {
        Args: { step_id: string; input_user_id?: string }
        Returns: boolean
      }
      categorize_transaction: {
        Args: { description: string; amount: number }
        Returns: string
      }
      cleanup_empty_pallets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_order_from_invoice: {
        Args: { invoice_id_param: string }
        Returns: undefined
      }
      current_user_is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      demote_manager_to_employee: {
        Args: { employee_uuid: string; warehouse_uuid: string }
        Returns: Json
      }
      fix_existing_invoice_inventory: {
        Args: Record<PropertyKey, never>
        Returns: {
          invoice_id: string
          product_name: string
          sku: string
          quantity_reduced: number
          new_stock: number
          action_taken: string
        }[]
      }
      fix_incomplete_user_setup: {
        Args: { target_user_id: string }
        Returns: Json
      }
      generate_batch_number: {
        Args: { product_uuid: string; user_uuid: string }
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_accessible_warehouses: {
        Args: { user_uuid?: string }
        Returns: {
          warehouse_id: string
          warehouse_name: string
          warehouse_code: string
          access_level: string
          company_id: string
        }[]
      }
      get_company_metrics: {
        Args: { company_uuid: string; user_uuid?: string }
        Returns: Json
      }
      get_effective_role: {
        Args: { employee_uuid: string }
        Returns: string
      }
      get_effective_warehouse_role: {
        Args: { user_uuid: string; warehouse_uuid: string }
        Returns: string
      }
      get_unassigned_inventory: {
        Args: { user_uuid?: string; warehouse_uuid?: string }
        Returns: {
          product_id: string
          product_name: string
          product_sku: string
          total_quantity: number
          assigned_quantity: number
          unassigned_quantity: number
        }[]
      }
      get_user_admin_companies: {
        Args: { user_uuid?: string }
        Returns: {
          company_id: string
          company_name: string
        }[]
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company_ids: {
        Args: { user_uuid?: string }
        Returns: string[]
      }
      get_user_company_info: {
        Args: { user_id: string }
        Returns: {
          company_id: string
          company_name: string
          user_role: string
          permissions: Json
        }[]
      }
      get_user_data_scope: {
        Args: { user_uuid?: string }
        Returns: Json
      }
      get_user_primary_company_id: {
        Args: { user_uuid?: string }
        Returns: string
      }
      get_user_task_metrics: {
        Args: { user_uuid?: string }
        Returns: Json
      }
      get_user_warehouse_ids: {
        Args: { user_uuid?: string }
        Returns: string[]
      }
      get_user_warehouses: {
        Args: { user_uuid?: string }
        Returns: {
          warehouse_id: string
          warehouse_name: string
          warehouse_code: string
          user_role: string
          is_manager: boolean
        }[]
      }
      get_warehouse_orders: {
        Args: { user_uuid?: string; warehouse_uuid?: string }
        Returns: {
          carrier: string | null
          company_id: string | null
          created_at: string
          customer_name: string
          id: string
          ship_date: string | null
          shipment_status: string | null
          shipping_address: string | null
          shipping_method: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }[]
      }
      get_warehouse_products: {
        Args: { user_uuid?: string; warehouse_uuid?: string }
        Returns: {
          asin: string | null
          case_cost: number | null
          case_price: number | null
          casesize: string | null
          category: string | null
          company_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          dimensions: string | null
          expiration: string | null
          id: string
          image_url: string | null
          location: string | null
          low_stock_threshold: number | null
          name: string
          quantity: number
          sku: string
          unit_price: number | null
          upc: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
          weight: string | null
        }[]
      }
      has_warehouse_access: {
        Args: { warehouse_uuid: string }
        Returns: boolean
      }
      is_company_admin_for_warehouse: {
        Args: { warehouse_uuid?: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { user_uuid?: string; company_uuid?: string }
        Returns: boolean
      }
      is_user_manager: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_warehouse_manager: {
        Args: { warehouse_uuid: string }
        Returns: boolean
      }
      promote_employee_to_manager: {
        Args: { employee_uuid: string; warehouse_uuid: string }
        Returns: Json
      }
      reduce_invoice_inventory: {
        Args: { invoice_id_param: string; execution_mode?: string }
        Returns: Json
      }
      restore_invoice_inventory: {
        Args: { invoice_id_param: string }
        Returns: undefined
      }
      safe_assign_user_to_warehouse: {
        Args: {
          target_user_id: string
          target_warehouse_id: string
          warehouse_role?: string
        }
        Returns: Json
      }
      sync_employee_roles: {
        Args: { employee_uuid: string }
        Returns: Json
      }
      test_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_inventory_reduction_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_rls_policies: {
        Args: { user_uuid?: string }
        Returns: Json
      }
      user_is_approved: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      user_needs_approval: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      user_needs_password_change: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      validate_company_admin_for_warehouse: {
        Args: { company_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      validate_company_isolation: {
        Args: { target_company_id: string }
        Returns: {
          validation_passed: boolean
          issues_found: string[]
        }[]
      }
      validate_invoice_inventory: {
        Args: { items_json: Json; user_uuid?: string }
        Returns: Json
      }
      validate_role_hierarchy: {
        Args: { company_role: string; warehouse_role: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
