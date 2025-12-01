import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { toast } from 'sonner';

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
  bonus_amount?: number;
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
  notes?: string;
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
  totalPayroll: number;
  employeeCount: number;
  averagePayPerEmployee: number;
  unpaidEntries: number;
  ytdPayroll: number;
}

interface PayrollCalculation {
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  healthInsurance: number;
  dentalInsurance: number;
  retirement401k: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  hourlyRate: number;
  overtimeRate: number;
}

export const usePayrollManagement = () => {
  const { user } = useAuth();
  const { selectedWarehouse, companyId } = useWarehouse();
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayrollEntries = async () => {
    if (!user || !companyId) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('payroll_entries')
        .select(`
          *,
          employees!inner(name, position, department)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (selectedWarehouse) {
        query = query.eq('warehouse_id', selectedWarehouse);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedEntries: PayrollEntry[] = (data || []).map((entry: any) => ({
        id: entry.id,
        employee_id: entry.employee_id,
        employee_name: entry.employees?.name || 'Unknown',
        employee_position: entry.employees?.position || 'N/A',
        department: entry.employees?.department || 'N/A',
        pay_period_start: entry.pay_period_start,
        pay_period_end: entry.pay_period_end,
        hours_worked: Number(entry.hours_worked),
        overtime_hours: Number(entry.overtime_hours || 0),
        hourly_rate: Number(entry.hourly_rate),
        overtime_rate: Number(entry.overtime_rate),
        bonus_amount: Number(entry.bonus_amount || 0),
        gross_pay: Number(entry.gross_pay),
        federal_tax: Number(entry.federal_tax),
        state_tax: Number(entry.state_tax),
        social_security: Number(entry.social_security),
        medicare: Number(entry.medicare),
        health_insurance: Number(entry.health_insurance),
        dental_insurance: Number(entry.dental_insurance),
        retirement_401k: Number(entry.retirement_401k),
        other_deductions: Number(entry.other_deductions),
        total_deductions: Number(entry.total_deductions),
        net_pay: Number(entry.net_pay),
        status: entry.status,
        pay_date: entry.pay_date,
        notes: entry.notes,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      }));

      setPayrollEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      toast.error('Failed to fetch payroll entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollEntries();
  }, [user, companyId, selectedWarehouse]);

  const calculatePayrollForEmployee = (
    employee: any,
    hoursWorked: number,
    overtimeHours: number = 0,
    bonusAmount: number = 0
  ): PayrollCalculation => {
    const hourlyRate = Number(employee.hourly_rate || 0);
    const overtimeRate = hourlyRate * 1.5;

    // Calculate gross pay
    const regularPay = hoursWorked * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = regularPay + overtimePay + bonusAmount;

    // Calculate taxes
    const federalTax = grossPay * 0.22; // 22% federal tax rate
    const stateTax = grossPay * 0.05; // 5% state tax rate
    const socialSecurity = grossPay * 0.062; // 6.2% social security
    const medicare = grossPay * 0.0145; // 1.45% medicare

    // Get employee deductions from their record
    const healthInsurance = Number(employee.health_insurance_amount || 0);
    const dentalInsurance = Number(employee.dental_insurance_amount || 0);
    const retirement401k = Number(employee.retirement_401k_amount || 0);
    const otherDeductions = Number(employee.other_deductions_amount || 0);

    // Calculate totals
    const totalDeductions = 
      federalTax + 
      stateTax + 
      socialSecurity + 
      medicare + 
      healthInsurance + 
      dentalInsurance + 
      retirement401k + 
      otherDeductions;

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
      overtimeRate,
    };
  };

  const createPayrollEntry = async (payrollData: {
    employee_id: string;
    pay_period_start: string;
    pay_period_end: string;
    hours_worked: number;
    overtime_hours?: number;
    bonus_amount?: number;
    notes?: string;
  }) => {
    if (!user || !companyId) {
      toast.error('User or company not found');
      return;
    }

    try {
      // Fetch employee data for calculations
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', payrollData.employee_id)
        .single();

      if (employeeError) throw employeeError;

      // Calculate payroll
      const calculation = calculatePayrollForEmployee(
        employee,
        payrollData.hours_worked,
        payrollData.overtime_hours || 0,
        payrollData.bonus_amount || 0
      );

      // Create payroll entry
      const { error } = await supabase.from('payroll_entries').insert({
        employee_id: payrollData.employee_id,
        user_id: user.id,
        company_id: companyId,
        warehouse_id: selectedWarehouse || null,
        pay_period_start: payrollData.pay_period_start,
        pay_period_end: payrollData.pay_period_end,
        hours_worked: payrollData.hours_worked,
        overtime_hours: payrollData.overtime_hours || 0,
        bonus_amount: payrollData.bonus_amount || 0,
        hourly_rate: calculation.hourlyRate,
        overtime_rate: calculation.overtimeRate,
        gross_pay: calculation.grossPay,
        federal_tax: calculation.federalTax,
        state_tax: calculation.stateTax,
        social_security: calculation.socialSecurity,
        medicare: calculation.medicare,
        health_insurance: calculation.healthInsurance,
        dental_insurance: calculation.dentalInsurance,
        retirement_401k: calculation.retirement401k,
        other_deductions: calculation.otherDeductions,
        total_deductions: calculation.totalDeductions,
        net_pay: calculation.netPay,
        notes: payrollData.notes,
        status: 'draft',
      });

      if (error) throw error;

      toast.success('Payroll entry created successfully');
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error creating payroll entry:', error);
      toast.error('Failed to create payroll entry');
    }
  };

  const updatePayrollEntry = async (entryId: string, updates: Partial<PayrollEntry>) => {
    try {
      const { error } = await supabase
        .from('payroll_entries')
        .update(updates)
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Payroll entry updated successfully');
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error updating payroll entry:', error);
      toast.error('Failed to update payroll entry');
    }
  };

  const deletePayrollEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Payroll entry deleted successfully');
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error deleting payroll entry:', error);
      toast.error('Failed to delete payroll entry');
    }
  };

  const processPayrollEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_entries')
        .update({ status: 'processed' })
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Payroll entry processed');
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error processing payroll entry:', error);
      toast.error('Failed to process payroll entry');
    }
  };

  const payPayrollEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_entries')
        .update({ 
          status: 'paid',
          pay_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Payroll entry marked as paid');
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error paying payroll entry:', error);
      toast.error('Failed to mark payroll as paid');
    }
  };

  const bulkCreatePayroll = async () => {
    if (!user || !companyId) return;

    try {
      setLoading(true);

      // Fetch all active employees
      let query = supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (selectedWarehouse) {
        query = query.eq('assigned_warehouse_id', selectedWarehouse);
      }

      const { data: employees, error: employeesError } = await query;

      if (employeesError) throw employeesError;

      // Calculate pay period (last 2 weeks)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);

      // Create payroll entries for all employees (assuming 80 hours per pay period)
      const entries = employees.map(employee => {
        const calculation = calculatePayrollForEmployee(employee, 80, 0, 0);
        
        return {
          employee_id: employee.id,
          user_id: user.id,
          company_id: companyId,
          warehouse_id: selectedWarehouse || null,
          pay_period_start: startDate.toISOString().split('T')[0],
          pay_period_end: endDate.toISOString().split('T')[0],
          hours_worked: 80,
          overtime_hours: 0,
          bonus_amount: 0,
          hourly_rate: calculation.hourlyRate,
          overtime_rate: calculation.overtimeRate,
          gross_pay: calculation.grossPay,
          federal_tax: calculation.federalTax,
          state_tax: calculation.stateTax,
          social_security: calculation.socialSecurity,
          medicare: calculation.medicare,
          health_insurance: calculation.healthInsurance,
          dental_insurance: calculation.dentalInsurance,
          retirement_401k: calculation.retirement401k,
          other_deductions: calculation.otherDeductions,
          total_deductions: calculation.totalDeductions,
          net_pay: calculation.netPay,
          status: 'draft',
        };
      });

      const { error } = await supabase.from('payroll_entries').insert(entries);

      if (error) throw error;

      toast.success(`Created ${entries.length} payroll entries`);
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error creating bulk payroll:', error);
      toast.error('Failed to create bulk payroll');
    } finally {
      setLoading(false);
    }
  };

  const processPayroll = async () => {
    try {
      const draftEntries = payrollEntries.filter(e => e.status === 'draft');
      
      const { error } = await supabase
        .from('payroll_entries')
        .update({ status: 'processed' })
        .in('id', draftEntries.map(e => e.id));

      if (error) throw error;

      toast.success(`Processed ${draftEntries.length} payroll entries`);
      await fetchPayrollEntries();
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast.error('Failed to process payroll');
    }
  };

  const getPayrollSummary = (): PayrollSummary => {
    const uniqueEmployees = new Set(payrollEntries.map(e => e.employee_id)).size;
    const totalGrossPay = payrollEntries.reduce((sum, e) => sum + e.gross_pay, 0);
    const totalDeductions = payrollEntries.reduce((sum, e) => sum + e.total_deductions, 0);
    const totalNetPay = payrollEntries.reduce((sum, e) => sum + e.net_pay, 0);
    
    const pendingPayroll = payrollEntries.filter(e => e.status === 'draft').length;
    const processedPayroll = payrollEntries.filter(e => e.status === 'processed').length;
    const paidPayroll = payrollEntries.filter(e => e.status === 'paid').length;
    const unpaidEntries = pendingPayroll + processedPayroll;

    return {
      totalEmployees: uniqueEmployees,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
      pendingPayroll,
      processedPayroll,
      paidPayroll,
      totalPayroll: payrollEntries.length,
      employeeCount: uniqueEmployees,
      averagePayPerEmployee: uniqueEmployees > 0 ? totalNetPay / uniqueEmployees : 0,
      unpaidEntries,
      ytdPayroll: totalNetPay,
    };
  };

  const refreshData = async () => {
    await fetchPayrollEntries();
  };

  return {
    payrollEntries,
    loading,
    fetchPayrollEntries,
    calculatePayrollForEmployee,
    createPayrollEntry,
    updatePayrollEntry,
    deletePayrollEntry,
    processPayrollEntry,
    payPayrollEntry,
    bulkCreatePayroll,
    processPayroll,
    getPayrollSummary,
    refreshData,
  };
};
