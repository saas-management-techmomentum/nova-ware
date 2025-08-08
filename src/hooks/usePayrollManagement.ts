import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from './useEmployees';

export interface PayrollEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  department: string;
  pay_period_start: string;
  pay_period_end: string;
  hours_worked: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_rate: number;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  health_insurance: number;
  dental_insurance: number;
  retirement_401k: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  status: 'draft' | 'processed' | 'paid';
  pay_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  pendingPayroll: number;
  processedPayroll: number;
  paidPayroll: number;
}

export const usePayrollManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { employees } = useEmployees();
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayrollEntries = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollEntries((data || []) as PayrollEntry[]);
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      setPayrollEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const calculatePayrollForEmployee = (
    employee: any,
    hoursWorked: number,
    overtimeHours: number = 0,
    bonusAmount: number = 0
  ) => {
    const hourlyRate = employee.hourly_rate || 15;
    const overtimeRate = hourlyRate * 1.5;
    
    const regularPay = hoursWorked * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = regularPay + overtimePay + bonusAmount;

    // Calculate deductions based on employee data and standard rates
    const federalTaxRate = 0.12; // 12% federal tax
    const stateTaxRate = 0.05; // 5% state tax
    const socialSecurityRate = 0.062; // 6.2%
    const medicareRate = 0.0145; // 1.45%

    const federalTax = grossPay * federalTaxRate;
    const stateTax = grossPay * stateTaxRate;
    const socialSecurity = grossPay * socialSecurityRate;
    const medicare = grossPay * medicareRate;
    const healthInsurance = employee.health_insurance_amount || 0;
    const dentalInsurance = employee.dental_insurance_amount || 0;
    const retirement401k = employee.retirement_401k_amount || 0;
    const otherDeductions = employee.other_deductions_amount || 0;

    const totalDeductions = federalTax + stateTax + socialSecurity + medicare + 
                          healthInsurance + dentalInsurance + retirement401k + otherDeductions;
    
    const netPay = grossPay - totalDeductions;

    return {
      grossPay,
      federalTax,
      stateTax,
      socialSecurity,
      medicare,
      healthInsurance,
      dentalInsurance,
      retirement401k,
      otherDeductions,
      totalDeductions,
      netPay,
      hourlyRate,
      overtimeRate
    };
  };

  const createPayrollEntry = async (data: {
    employeeId: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    hoursWorked: number;
    overtimeHours?: number;
    bonusAmount?: number;
  }) => {
    if (!user?.id) return;

    try {
      const employee = employees.find(emp => emp.id === data.employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const calculations = calculatePayrollForEmployee(
        employee,
        data.hoursWorked,
        data.overtimeHours || 0,
        data.bonusAmount || 0
      );

      // Create payroll entry in database
      const newEntry = {
        user_id: user.id,
        employee_id: data.employeeId,
        employee_name: employee.name,
        employee_position: employee.position || '',
        department: employee.department || '',
        pay_period_start: data.payPeriodStart,
        pay_period_end: data.payPeriodEnd,
        hours_worked: data.hoursWorked,
        overtime_hours: data.overtimeHours || 0,
        hourly_rate: calculations.hourlyRate,
        overtime_rate: calculations.overtimeRate,
        gross_pay: calculations.grossPay,
        federal_tax: calculations.federalTax,
        state_tax: calculations.stateTax,
        social_security: calculations.socialSecurity,
        medicare: calculations.medicare,
        health_insurance: calculations.healthInsurance,
        dental_insurance: calculations.dentalInsurance,
        retirement_401k: calculations.retirement401k,
        other_deductions: calculations.otherDeductions,
        total_deductions: calculations.totalDeductions,
        net_pay: calculations.netPay,
        status: 'draft'
      };

      const { data: savedEntry, error } = await supabase
        .from('payroll_entries')
        .insert([newEntry])
        .select()
        .single();

      if (error) throw error;

      setPayrollEntries(prev => [savedEntry as PayrollEntry, ...prev]);

      toast({
        title: "Payroll entry created",
        description: `Payroll entry for ${employee.name} has been created`,
      });

      return newEntry;
    } catch (error) {
      console.error('Error creating payroll entry:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll entry",
        variant: "destructive",
      });
      throw error;
    }
  };

  const processPayrollEntry = async (entryId: string) => {
    if (!user?.id) return;

    try {
      setPayrollEntries(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, status: 'processed' as const, updated_at: new Date().toISOString() }
            : entry
        )
      );

      // Create journal entry for GL posting
      const processedEntry = payrollEntries.find(e => e.id === entryId);
      if (processedEntry) {
        await createPayrollJournalEntry({ ...processedEntry, status: 'processed' });
      }

      toast({
        title: "Payroll processed",
        description: "Payroll entry has been processed and posted to GL",
      });
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Error",
        description: "Failed to process payroll entry",
        variant: "destructive",
      });
    }
  };

  const createPayrollJournalEntry = async (payrollEntry: PayrollEntry) => {
    try {
      // Get chart of accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id);

      if (!accounts) return;

      const payrollExpenseAccount = accounts.find(acc => acc.account_code === '6000');
      const cashAccount = accounts.find(acc => acc.account_code === '1000');
      const taxPayableAccount = accounts.find(acc => acc.account_code === '2100');

      if (!payrollExpenseAccount || !cashAccount || !taxPayableAccount) {
        console.warn('Required accounts not found for payroll GL posting');
        return;
      }

      // Create journal entry
      const journalEntry = {
        user_id: user?.id,
        entry_number: `PAY-${payrollEntry.id}`,
        entry_date: new Date().toISOString().split('T')[0],
        description: `Payroll - ${payrollEntry.employee_name} - ${payrollEntry.pay_period_start} to ${payrollEntry.pay_period_end}`,
        total_amount: payrollEntry.gross_pay,
        status: 'posted',
        created_by: user?.id,
        reference: `Payroll Entry: ${payrollEntry.id}`
      };

      const { data: je, error: jeError } = await supabase
        .from('journal_entries')
        .insert([journalEntry])
        .select()
        .single();

      if (jeError) throw jeError;

      // Create journal entry lines
      const journalLines = [
        {
          journal_entry_id: je.id,
          account_id: payrollExpenseAccount.id,
          line_number: 1,
          description: `Payroll Expense - ${payrollEntry.employee_name}`,
          debit_amount: payrollEntry.gross_pay,
          credit_amount: 0
        },
        {
          journal_entry_id: je.id,
          account_id: cashAccount.id,
          line_number: 2,
          description: `Cash Payment - ${payrollEntry.employee_name}`,
          debit_amount: 0,
          credit_amount: payrollEntry.net_pay
        },
        {
          journal_entry_id: je.id,
          account_id: taxPayableAccount.id,
          line_number: 3,
          description: `Tax Withholdings - ${payrollEntry.employee_name}`,
          debit_amount: 0,
          credit_amount: payrollEntry.total_deductions
        }
      ];

      const { error: lineError } = await supabase
        .from('journal_entry_lines')
        .insert(journalLines);

      if (lineError) throw lineError;

    } catch (error) {
      console.error('Error creating payroll journal entry:', error);
    }
  };

  const payPayrollEntry = async (entryId: string, payDate: string) => {
    if (!user?.id) return;

    try {
      setPayrollEntries(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                status: 'paid' as const, 
                pay_date: payDate,
                updated_at: new Date().toISOString() 
              }
            : entry
        )
      );

      toast({
        title: "Payroll paid",
        description: "Payroll entry has been marked as paid",
      });
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark payroll as paid",
        variant: "destructive",
      });
    }
  };

  const getPayrollSummary = (): PayrollSummary => {
    const totalEmployees = new Set(payrollEntries.map(entry => entry.employee_id)).size;
    const totalGrossPay = payrollEntries.reduce((sum, entry) => sum + entry.gross_pay, 0);
    const totalDeductions = payrollEntries.reduce((sum, entry) => sum + entry.total_deductions, 0);
    const totalNetPay = payrollEntries.reduce((sum, entry) => sum + entry.net_pay, 0);
    
    const pendingPayroll = payrollEntries.filter(entry => entry.status === 'draft').length;
    const processedPayroll = payrollEntries.filter(entry => entry.status === 'processed').length;
    const paidPayroll = payrollEntries.filter(entry => entry.status === 'paid').length;

    return {
      totalEmployees,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
      pendingPayroll,
      processedPayroll,
      paidPayroll
    };
  };

  useEffect(() => {
    if (user) {
      fetchPayrollEntries();
    }
  }, [user, fetchPayrollEntries]);

  return {
    payrollEntries,
    loading,
    fetchPayrollEntries,
    createPayrollEntry,
    processPayrollEntry,
    payPayrollEntry,
    calculatePayrollForEmployee,
    getPayrollSummary
  };
};