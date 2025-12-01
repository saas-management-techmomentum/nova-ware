import { supabase } from '@/integrations/supabase/client';

interface JournalEntryLine {
  account_code: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface JournalEntryData {
  entry_date: string;
  description: string;
  reference: string;
  lines: JournalEntryLine[];
  user_id: string;
  company_id: string;
  warehouse_id?: string | null;
}

/**
 * Helper function to get account ID by account code and company
 */
async function getAccountId(accountCode: string, companyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('account_code', accountCode)
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error(`Error fetching account ${accountCode}:`, error);
    return null;
  }

  return data?.id || null;
}

/**
 * Creates a journal entry with multiple lines
 */
async function createJournalEntry(entryData: JournalEntryData): Promise<boolean> {
  try {
    // Generate entry number
    const { data: existingEntries } = await supabase
      .from('journal_entries')
      .select('entry_number')
      .eq('company_id', entryData.company_id)
      .order('created_at', { ascending: false })
      .limit(1);

    let entryNumber = 'JE-000001';
    if (existingEntries && existingEntries.length > 0) {
      const lastNumber = parseInt(existingEntries[0].entry_number.split('-')[1] || '0');
      entryNumber = `JE-${String(lastNumber + 1).padStart(6, '0')}`;
    }

    // Calculate total amount (sum of debits or credits, should be equal)
    const totalAmount = entryData.lines.reduce((sum, line) => sum + line.debit_amount, 0);

    // Create journal entry header
    const { data: journalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        entry_number: entryNumber,
        entry_date: entryData.entry_date,
        description: entryData.description,
        reference: entryData.reference,
        total_amount: totalAmount,
        status: 'posted',
        user_id: entryData.user_id,
        company_id: entryData.company_id,
        warehouse_id: entryData.warehouse_id,
        created_by: entryData.user_id,
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // Create journal entry lines
    const lines = await Promise.all(
      entryData.lines.map(async (line) => {
        const accountId = await getAccountId(line.account_code, entryData.company_id);
        if (!accountId) {
          console.error(`Account ${line.account_code} not found for company ${entryData.company_id}`);
          return null;
        }

        return {
          journal_entry_id: journalEntry.id,
          account_id: accountId,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          description: line.description,
        };
      })
    );

    const validLines = lines.filter(line => line !== null);

    if (validLines.length === 0) {
      throw new Error('No valid account lines could be created');
    }

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(validLines);

    if (linesError) throw linesError;

    console.log(`✅ Journal entry ${entryNumber} created successfully`);
    return true;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return false;
  }
}

/**
 * Creates journal entry when invoice is sent/approved
 * DR: Accounts Receivable
 * CR: Sales Revenue
 */
export async function createInvoiceJournalEntry(
  invoice: {
    id: string;
    invoice_number: string;
    invoice_date: string;
    total_amount: number;
    client_name?: string;
    user_id: string;
    company_id: string;
    warehouse_id?: string | null;
  }
): Promise<boolean> {
  return createJournalEntry({
    entry_date: invoice.invoice_date,
    description: `Invoice ${invoice.invoice_number} - ${invoice.client_name || 'Customer'}`,
    reference: `Invoice: ${invoice.invoice_number}`,
    lines: [
      {
        account_code: '1100', // Accounts Receivable
        debit_amount: invoice.total_amount,
        credit_amount: 0,
        description: 'Invoice receivable',
      },
      {
        account_code: '4000', // Sales Revenue
        debit_amount: 0,
        credit_amount: invoice.total_amount,
        description: 'Sales revenue',
      },
    ],
    user_id: invoice.user_id,
    company_id: invoice.company_id,
    warehouse_id: invoice.warehouse_id,
  });
}

/**
 * Creates journal entry when invoice is paid
 * DR: Cash
 * CR: Accounts Receivable
 */
export async function createInvoicePaymentJournalEntry(
  payment: {
    invoice_number: string;
    payment_date: string;
    amount: number;
    user_id: string;
    company_id: string;
    warehouse_id?: string | null;
  }
): Promise<boolean> {
  return createJournalEntry({
    entry_date: payment.payment_date,
    description: `Payment received for Invoice ${payment.invoice_number}`,
    reference: `Payment: ${payment.invoice_number}`,
    lines: [
      {
        account_code: '1000', // Cash
        debit_amount: payment.amount,
        credit_amount: 0,
        description: 'Cash received',
      },
      {
        account_code: '1100', // Accounts Receivable
        debit_amount: 0,
        credit_amount: payment.amount,
        description: 'AR collected',
      },
    ],
    user_id: payment.user_id,
    company_id: payment.company_id,
    warehouse_id: payment.warehouse_id,
  });
}

/**
 * Creates journal entry when vendor bill is created
 * DR: Operating Expenses (or specific expense account)
 * CR: Accounts Payable
 */
export async function createVendorBillJournalEntry(
  bill: {
    bill_number: string;
    issue_date: string;
    amount: number;
    vendor_name: string;
    description?: string;
    user_id: string;
    company_id: string;
    warehouse_id?: string | null;
  }
): Promise<boolean> {
  return createJournalEntry({
    entry_date: bill.issue_date,
    description: `Vendor Bill ${bill.bill_number} - ${bill.vendor_name}`,
    reference: `Bill: ${bill.bill_number}`,
    lines: [
      {
        account_code: '5100', // Operating Expenses
        debit_amount: bill.amount,
        credit_amount: 0,
        description: bill.description || 'Vendor expense',
      },
      {
        account_code: '2000', // Accounts Payable
        debit_amount: 0,
        credit_amount: bill.amount,
        description: 'Amount owed to vendor',
      },
    ],
    user_id: bill.user_id,
    company_id: bill.company_id,
    warehouse_id: bill.warehouse_id,
  });
}

/**
 * Creates journal entry when vendor bill is paid
 * DR: Accounts Payable
 * CR: Cash
 */
export async function createBillPaymentJournalEntry(
  payment: {
    bill_number: string;
    payment_date: string;
    amount: number;
    vendor_name: string;
    user_id: string;
    company_id: string;
    warehouse_id?: string | null;
  }
): Promise<boolean> {
  return createJournalEntry({
    entry_date: payment.payment_date,
    description: `Payment to ${payment.vendor_name} for Bill ${payment.bill_number}`,
    reference: `Payment: ${payment.bill_number}`,
    lines: [
      {
        account_code: '2000', // Accounts Payable
        debit_amount: payment.amount,
        credit_amount: 0,
        description: 'AP paid',
      },
      {
        account_code: '1000', // Cash
        debit_amount: 0,
        credit_amount: payment.amount,
        description: 'Cash paid',
      },
    ],
    user_id: payment.user_id,
    company_id: payment.company_id,
    warehouse_id: payment.warehouse_id,
  });
}

/**
 * Creates journal entry when expense is recorded
 * DR: Operating Expenses (or specific expense category)
 * CR: Cash
 */
export async function createExpenseJournalEntry(
  expense: {
    description: string;
    transaction_date: string;
    amount: number;
    category?: string | null;
    reference?: string | null;
    user_id: string;
    company_id: string;
    warehouse_id?: string | null;
  }
): Promise<boolean> {
  return createJournalEntry({
    entry_date: expense.transaction_date,
    description: expense.description,
    reference: expense.reference || 'Expense',
    lines: [
      {
        account_code: '5100', // Operating Expenses
        debit_amount: expense.amount,
        credit_amount: 0,
        description: expense.category || 'General expense',
      },
      {
        account_code: '1000', // Cash
        debit_amount: 0,
        credit_amount: expense.amount,
        description: 'Cash paid',
      },
    ],
    user_id: expense.user_id,
    company_id: expense.company_id,
    warehouse_id: expense.warehouse_id,
  });
}
