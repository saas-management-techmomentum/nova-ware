import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { toast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

interface FinancialReport {
  id: string;
  user_id: string;
  company_id: string;
  warehouse_id?: string;
  report_name: string;
  report_type: string;
  description?: string;
  date_range_start?: string;
  date_range_end?: string;
  parameters?: any;
  generated_data?: any;
  file_url?: string;
  file_format: string;
  file_size?: string;
  status: string;
  is_template: boolean;
  frequency?: string;
  last_generated_at?: string;
  created_at: string;
  updated_at: string;
}

export const useFinancialReports = () => {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { companyId, selectedWarehouse } = useWarehouse();

  const fetchReports = async () => {
    if (!user || !companyId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch financial reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user, companyId]);

  const generateReportData = async (reportType: string, startDate?: string, endDate?: string) => {
    if (!companyId) return null;

    try {
      const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
      const end = endDate || new Date().toISOString();

      switch (reportType) {
        case 'profit-loss': {
          // Get revenue from invoices
          const { data: invoices } = await supabase
            .from('invoices')
            .select('total_amount, status')
            .eq('company_id', companyId)
            .in('status', ['paid', 'approved'])
            .gte('invoice_date', start)
            .lte('invoice_date', end);

          const revenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

          // Get expenses from billing_transactions
          const { data: expenses } = await supabase
            .from('billing_transactions')
            .select('amount, transaction_type')
            .eq('company_id', companyId)
            .eq('transaction_type', 'expense')
            .gte('transaction_date', start)
            .lte('transaction_date', end);

          const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

          return {
            revenue,
            expenses: totalExpenses,
            net_income: revenue - totalExpenses,
            period: { start, end }
          };
        }

        case 'balance-sheet': {
          const { data: accounts } = await supabase
            .from('accounts')
            .select('account_name, current_balance, account_types(category)')
            .eq('company_id', companyId)
            .eq('is_active', true);

          const assets = accounts?.filter(a => a.account_types?.category === 'asset')
            .reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0;
          
          const liabilities = accounts?.filter(a => a.account_types?.category === 'liability')
            .reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0;
          
          const equity = accounts?.filter(a => a.account_types?.category === 'equity')
            .reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0;

          return {
            assets,
            liabilities,
            equity,
            total_assets: assets,
            total_liabilities_equity: liabilities + equity
          };
        }

        case 'cash-flow': {
          const { data: transactions } = await supabase
            .from('bank_transactions')
            .select('amount, transaction_type, category')
            .eq('bank_accounts.company_id', companyId)
            .gte('transaction_date', start)
            .lte('transaction_date', end);

          const operating = transactions?.filter(t => t.category === 'operating')
            .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
          
          const investing = transactions?.filter(t => t.category === 'investing')
            .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
          
          const financing = transactions?.filter(t => t.category === 'financing')
            .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

          return {
            operating,
            investing,
            financing,
            net_cash_flow: operating + investing + financing
          };
        }

        case 'ar-aging': {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('invoice_number, client_name, total_amount, due_date, status')
            .eq('company_id', companyId)
            .neq('status', 'paid');

          const now = new Date();
          const aging = {
            current: 0,
            '31-60': 0,
            '61-90': 0,
            'over-90': 0
          };

          invoices?.forEach(inv => {
            const dueDate = new Date(inv.due_date);
            const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const amount = inv.total_amount || 0;

            if (daysPastDue <= 30) aging.current += amount;
            else if (daysPastDue <= 60) aging['31-60'] += amount;
            else if (daysPastDue <= 90) aging['61-90'] += amount;
            else aging['over-90'] += amount;
          });

          return aging;
        }

        default:
          return null;
      }
    } catch (error) {
      console.error('Error generating report data:', error);
      return null;
    }
  };

  const createReport = async (reportData: {
    report_name: string;
    report_type: string;
    description?: string;
    date_range_start?: string;
    date_range_end?: string;
    frequency?: string;
    file_format?: string;
  }) => {
    if (!user || !companyId) return { success: false, error: 'Not authenticated' };

    try {
      // Generate the report data
      const generated_data = await generateReportData(
        reportData.report_type,
        reportData.date_range_start,
        reportData.date_range_end
      );

      const { data, error } = await supabase
        .from('financial_reports')
        .insert({
          user_id: user.id,
          company_id: companyId,
          warehouse_id: selectedWarehouse,
          report_name: reportData.report_name,
          report_type: reportData.report_type,
          description: reportData.description,
          date_range_start: reportData.date_range_start,
          date_range_end: reportData.date_range_end,
          frequency: reportData.frequency || 'one-time',
          file_format: reportData.file_format || 'PDF',
          generated_data,
          status: 'completed',
          last_generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Report created successfully',
      });

      await fetchReports();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create report',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('financial_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Report deleted successfully',
      });

      await fetchReports();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete report',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const formatCurrency = (value: number): string => {
    return (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getReportTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'profit-loss': 'Profit & Loss Statement',
      'balance-sheet': 'Balance Sheet',
      'cash-flow': 'Cash Flow Statement',
      'ar-aging': 'Accounts Receivable Aging',
    };
    return labels[type] || type;
  };

  const generatePDF = (report: FinancialReport, fileName: string) => {
    const doc = new jsPDF();
    const data = report.generated_data || {};
    
    // Title
    doc.setFontSize(18);
    doc.text(report.report_name, 20, 20);
    
    // Report type subtitle
    doc.setFontSize(12);
    doc.text(`Report Type: ${getReportTypeLabel(report.report_type)}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 38);
    
    // Date range if available
    if (report.date_range_start && report.date_range_end) {
      doc.text(`Period: ${report.date_range_start} to ${report.date_range_end}`, 20, 46);
    }
    
    // Separator line
    doc.line(20, 52, 190, 52);
    
    // Report data based on type
    let yPos = 62;
    
    switch (report.report_type) {
      case 'profit-loss':
        doc.text(`Revenue: $${formatCurrency(data.revenue)}`, 20, yPos);
        doc.text(`Expenses: $${formatCurrency(data.expenses)}`, 20, yPos + 10);
        doc.text(`Net Income: $${formatCurrency(data.net_income)}`, 20, yPos + 20);
        break;
      case 'balance-sheet':
        doc.text(`Total Assets: $${formatCurrency(data.assets)}`, 20, yPos);
        doc.text(`Total Liabilities: $${formatCurrency(data.liabilities)}`, 20, yPos + 10);
        doc.text(`Total Equity: $${formatCurrency(data.equity)}`, 20, yPos + 20);
        break;
      case 'cash-flow':
        doc.text(`Operating Activities: $${formatCurrency(data.operating)}`, 20, yPos);
        doc.text(`Investing Activities: $${formatCurrency(data.investing)}`, 20, yPos + 10);
        doc.text(`Financing Activities: $${formatCurrency(data.financing)}`, 20, yPos + 20);
        doc.text(`Net Cash Flow: $${formatCurrency(data.net_cash_flow)}`, 20, yPos + 30);
        break;
      case 'ar-aging':
        doc.text(`Current (0-30 days): $${formatCurrency(data.current)}`, 20, yPos);
        doc.text(`31-60 days: $${formatCurrency(data['31-60'])}`, 20, yPos + 10);
        doc.text(`61-90 days: $${formatCurrency(data['61-90'])}`, 20, yPos + 20);
        doc.text(`Over 90 days: $${formatCurrency(data['over-90'])}`, 20, yPos + 30);
        break;
    }
    
    doc.save(`${fileName}.pdf`);
  };

  const generateExcel = (report: FinancialReport, fileName: string) => {
    const data = report.generated_data || {};
    let rows: any[] = [];
    
    // Convert report data to rows based on type
    switch (report.report_type) {
      case 'profit-loss':
        rows = [
          { Category: 'Revenue', Amount: data.revenue || 0 },
          { Category: 'Expenses', Amount: data.expenses || 0 },
          { Category: 'Net Income', Amount: data.net_income || 0 },
        ];
        break;
      case 'balance-sheet':
        rows = [
          { Category: 'Total Assets', Amount: data.assets || 0 },
          { Category: 'Total Liabilities', Amount: data.liabilities || 0 },
          { Category: 'Total Equity', Amount: data.equity || 0 },
        ];
        break;
      case 'cash-flow':
        rows = [
          { Category: 'Operating Activities', Amount: data.operating || 0 },
          { Category: 'Investing Activities', Amount: data.investing || 0 },
          { Category: 'Financing Activities', Amount: data.financing || 0 },
          { Category: 'Net Cash Flow', Amount: data.net_cash_flow || 0 },
        ];
        break;
      case 'ar-aging':
        rows = [
          { 'Aging Period': 'Current (0-30 days)', Amount: data.current || 0 },
          { 'Aging Period': '31-60 days', Amount: data['31-60'] || 0 },
          { 'Aging Period': '61-90 days', Amount: data['61-90'] || 0 },
          { 'Aging Period': 'Over 90 days', Amount: data['over-90'] || 0 },
        ];
        break;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, report.report_type);
    
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const downloadReport = (report: FinancialReport) => {
    const fileName = `${report.report_name}_${new Date().toISOString().split('T')[0]}`;
    
    if (report.file_format === 'PDF') {
      generatePDF(report, fileName);
    } else if (report.file_format === 'Excel') {
      generateExcel(report, fileName);
    } else {
      // Fallback to JSON
      const dataStr = JSON.stringify(report.generated_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Success',
      description: 'Report downloaded successfully',
    });
  };

  return {
    reports,
    isLoading,
    createReport,
    deleteReport,
    downloadReport,
    refetch: fetchReports,
  };
};
