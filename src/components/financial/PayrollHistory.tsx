import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Download, 
  Eye, 
  CalendarIcon,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  RefreshCw,
  Calendar as CalendarIconLarge,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PayrollEntry } from '@/hooks/usePayrollManagement';

interface PayrollHistoryProps {
  payrollEntries: PayrollEntry[];
  formatCurrency: (amount: number) => string;
  loading?: boolean;
}

interface PayrollRun {
  id: string;
  runDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  employeeCount: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  status: 'completed' | 'partial' | 'failed';
  entries: PayrollEntry[];
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({
  payrollEntries,
  formatCurrency,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayrollRun, setSelectedPayrollRun] = useState<PayrollRun | null>(null);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });

  // Group payroll entries by pay period to create "payroll runs"
  const payrollRuns = useMemo((): PayrollRun[] => {
    const runMap = new Map<string, PayrollRun>();
    
    payrollEntries
      .filter(entry => entry.status === 'paid')
      .forEach(entry => {
        const key = `${entry.pay_period_start}-${entry.pay_period_end}`;
        
        if (!runMap.has(key)) {
          runMap.set(key, {
            id: key,
            runDate: entry.pay_date || entry.updated_at,
            payPeriodStart: entry.pay_period_start,
            payPeriodEnd: entry.pay_period_end,
            employeeCount: 0,
            totalGrossPay: 0,
            totalDeductions: 0,
            totalNetPay: 0,
            status: 'completed',
            entries: []
          });
        }
        
        const run = runMap.get(key)!;
        run.employeeCount += 1;
        run.totalGrossPay += entry.gross_pay;
        run.totalDeductions += entry.total_deductions;
        run.totalNetPay += entry.net_pay;
        run.entries.push(entry);
      });
    
    return Array.from(runMap.values()).sort((a, b) => 
      new Date(b.runDate).getTime() - new Date(a.runDate).getTime()
    );
  }, [payrollEntries]);

  // Filter payroll runs based on search and filters
  const filteredPayrollRuns = useMemo(() => {
    return payrollRuns.filter(run => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        run.entries.some(entry => 
          entry.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.department.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Date range filter
      const matchesDateRange = !dateRange.start || !dateRange.end || 
        isWithinInterval(new Date(run.runDate), {
          start: dateRange.start,
          end: dateRange.end
        });

      return matchesSearch && matchesDateRange;
    });
  }, [payrollRuns, searchTerm, dateRange]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Partial
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportCSV = (payrollRun?: PayrollRun) => {
    const dataToExport = payrollRun ? [payrollRun] : filteredPayrollRuns;
    
    const csvData = [
      ['Run Date', 'Pay Period', 'Employee Count', 'Gross Pay', 'Deductions', 'Net Pay', 'Status'],
      ...dataToExport.map(run => [
        new Date(run.runDate).toLocaleDateString(),
        `${new Date(run.payPeriodStart).toLocaleDateString()} - ${new Date(run.payPeriodEnd).toLocaleDateString()}`,
        run.employeeCount.toString(),
        run.totalGrossPay.toString(),
        run.totalDeductions.toString(),
        run.totalNetPay.toString(),
        run.status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading payroll history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Payroll Runs</p>
                <p className="text-2xl font-bold">{payrollRuns.length}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <CalendarIconLarge className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Employees Paid</p>
                <p className="text-2xl font-bold">
                  {new Set(payrollEntries.filter(e => e.status === 'paid').map(e => e.employee_id)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique employees</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-xl">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Gross Pay</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(payrollRuns.reduce((sum, run) => sum + run.totalGrossPay, 0))}
                </p>
                <p className="text-xs text-muted-foreground">All payroll runs</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Net Pay</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(payrollRuns.reduce((sum, run) => sum + run.totalNetPay, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Amount paid out</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-xl">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search employees or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-80 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start && dateRange.end ? (
                      `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`
                    ) : (
                      "Filter by date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-3">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Calendar
                        mode="single"
                        selected={dateRange.start || undefined}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, start: date || null }))}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Calendar
                        mode="single"
                        selected={dateRange.end || undefined}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, end: date || null }))}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDateRange({ start: null, end: null })}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={() => handleExportCSV()}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Run History</CardTitle>
          <CardDescription>
            {payrollRuns.length === 0 
              ? "No completed payroll runs yet. Complete payroll entries to see history here."
              : `Historical record of all payroll runs (${filteredPayrollRuns.length} of ${payrollRuns.length} runs)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIconLarge className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No payroll runs completed</h3>
              <p className="text-muted-foreground">
                Completed payroll runs will appear here for historical tracking and compliance reporting.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payroll Run Date</TableHead>
                  <TableHead>Payroll Period</TableHead>
                  <TableHead>Employees Paid</TableHead>
                  <TableHead>Gross Pay Total</TableHead>
                  <TableHead>Deductions Total</TableHead>
                  <TableHead>Net Pay Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      {new Date(run.runDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(run.payPeriodStart).toLocaleDateString()} - 
                        {new Date(run.payPeriodEnd).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {run.employeeCount}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(run.totalGrossPay)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(run.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(run.totalNetPay)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(run.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedPayrollRun(run)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Payroll Run Details - {new Date(run.runDate).toLocaleDateString()}
                              </DialogTitle>
                              <DialogDescription>
                                Pay Period: {new Date(run.payPeriodStart).toLocaleDateString()} - {new Date(run.payPeriodEnd).toLocaleDateString()}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Run Summary */}
                              <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-muted-foreground">Employees Paid</p>
                                      <p className="text-2xl font-bold">{run.employeeCount}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-muted-foreground">Total Gross</p>
                                      <p className="text-2xl font-bold">{formatCurrency(run.totalGrossPay)}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <p className="text-sm text-muted-foreground">Total Net</p>
                                      <p className="text-2xl font-bold text-green-600">{formatCurrency(run.totalNetPay)}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Employee Breakdown */}
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="text-lg font-medium">Employee Breakdown</h4>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleExportCSV(run)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Run
                                  </Button>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Employee</TableHead>
                                      <TableHead>Hours</TableHead>
                                      <TableHead>Gross Pay</TableHead>
                                      <TableHead>Deductions</TableHead>
                                      <TableHead>Net Pay</TableHead>
                                      <TableHead>Payment Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {run.entries.map((entry) => (
                                      <TableRow key={entry.id}>
                                        <TableCell>
                                          <div>
                                            <div className="font-medium">{entry.employee_name}</div>
                                            <div className="text-sm text-muted-foreground">{entry.employee_position}</div>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div>
                                            <span>{entry.hours_worked}h</span>
                                            {entry.overtime_hours > 0 && (
                                              <div className="text-xs text-orange-600">
                                                +{entry.overtime_hours}h OT
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {formatCurrency(entry.gross_pay)}
                                        </TableCell>
                                        <TableCell className="text-red-600">
                                          -{formatCurrency(entry.total_deductions)}
                                        </TableCell>
                                        <TableCell className="font-medium text-green-600">
                                          {formatCurrency(entry.net_pay)}
                                        </TableCell>
                                        <TableCell>
                                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                            Paid
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Payroll Notes */}
                              <div>
                                <h4 className="text-lg font-medium mb-2">Payroll Notes</h4>
                                <div className="bg-muted p-4 rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    Payroll run completed successfully on {new Date(run.runDate).toLocaleDateString()}.
                                    All {run.employeeCount} employees have been paid for the period {new Date(run.payPeriodStart).toLocaleDateString()} - {new Date(run.payPeriodEnd).toLocaleDateString()}.
                                    Journal entries have been posted to the General Ledger.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExportCSV(run)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};