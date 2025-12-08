import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Users, 
  DollarSign, 
  Calculator, 
  CalendarIcon,
  Plus,
  TrendingUp,
  Search,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  TrendingDown,
  UserX,
  Clock
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayrollManagement } from '@/hooks/usePayrollManagement';
import { PayrollHistory } from './PayrollHistory';

export const PayrollManagement: React.FC = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { 
    payrollEntries, 
    loading: payrollLoading,
    createPayrollEntry,
    processPayrollEntry,
    payPayrollEntry,
    getPayrollSummary,
    calculatePayrollForEmployee
  } = usePayrollManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isProcessPayrollOpen, setIsProcessPayrollOpen] = useState(false);
  const [isCreatePayrollOpen, setIsCreatePayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Form state for new payroll entry
  const [newPayrollData, setNewPayrollData] = useState({
    payPeriodStart: null as Date | null,
    payPeriodEnd: null as Date | null,
    hoursWorked: '',
    overtimeHours: '',
    bonusAmount: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>;
      case 'processed':
        return <Badge className="bg-gray-700/20 text-gray-400 border-gray-600/30">Processed</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const summary = getPayrollSummary();
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  
  const filteredPayroll = payrollEntries.filter(entry => {
    const matchesSearch = entry.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.employee_position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || entry.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleCreatePayroll = async () => {
    if (!selectedEmployee || !newPayrollData.payPeriodStart || !newPayrollData.payPeriodEnd || !newPayrollData.hoursWorked) {
      return;
    }

    try {
      await createPayrollEntry({
        employee_id: selectedEmployee,
        pay_period_start: newPayrollData.payPeriodStart.toISOString().split('T')[0],
        pay_period_end: newPayrollData.payPeriodEnd.toISOString().split('T')[0],
        hours_worked: parseFloat(newPayrollData.hoursWorked),
        overtime_hours: newPayrollData.overtimeHours ? parseFloat(newPayrollData.overtimeHours) : 0,
        bonus_amount: newPayrollData.bonusAmount ? parseFloat(newPayrollData.bonusAmount) : 0,
      });

      // Reset form
      setSelectedEmployee('');
      setNewPayrollData({
        payPeriodStart: null,
        payPeriodEnd: null,
        hoursWorked: '',
        overtimeHours: '',
        bonusAmount: ''
      });
      setIsCreatePayrollOpen(false);
    } catch (error) {
      console.error('Failed to create payroll entry:', error);
    }
  };

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  if (employeesLoading || payrollLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400 mx-auto"></div>
          <p className="mt-2 text-neutral-400">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Payroll Management</h2>
          <p className="text-neutral-400 mt-1">Manage employee compensation and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreatePayrollOpen} onOpenChange={setIsCreatePayrollOpen}>
            <DialogTrigger asChild>
              <Button disabled={activeEmployees.length === 0} className="bg-white text-black hover:bg-neutral-200">
                <Plus className="h-4 w-4 mr-2" />
                Create Payroll Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Payroll Entry</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Create a new payroll entry for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-neutral-300">Select Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                      <SelectValue placeholder="Choose an employee" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700">
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position} ({employee.department || 'No Department'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-neutral-300">Pay Period Start</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-neutral-900 border-neutral-700 text-white",
                            !newPayrollData.payPeriodStart && "text-neutral-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newPayrollData.payPeriodStart ? format(newPayrollData.payPeriodStart, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
                        <Calendar
                          mode="single"
                          selected={newPayrollData.payPeriodStart || undefined}
                          onSelect={(date) => setNewPayrollData(prev => ({ ...prev, payPeriodStart: date || null }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-neutral-300">Pay Period End</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-neutral-900 border-neutral-700 text-white",
                            !newPayrollData.payPeriodEnd && "text-neutral-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newPayrollData.payPeriodEnd ? format(newPayrollData.payPeriodEnd, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
                        <Calendar
                          mode="single"
                          selected={newPayrollData.payPeriodEnd || undefined}
                          onSelect={(date) => setNewPayrollData(prev => ({ ...prev, payPeriodEnd: date || null }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-neutral-300">Hours Worked</Label>
                    <Input 
                      type="number" 
                      placeholder="40"
                      value={newPayrollData.hoursWorked}
                      onChange={(e) => setNewPayrollData(prev => ({ ...prev, hoursWorked: e.target.value }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Overtime Hours</Label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={newPayrollData.overtimeHours}
                      onChange={(e) => setNewPayrollData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Bonus Amount</Label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={newPayrollData.bonusAmount}
                      onChange={(e) => setNewPayrollData(prev => ({ ...prev, bonusAmount: e.target.value }))}
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>
                </div>

                {/* Preview calculation if employee and hours are selected */}
                {selectedEmployee && newPayrollData.hoursWorked && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white">Payroll Preview</h4>
                    {(() => {
                      const employee = employees.find(emp => emp.id === selectedEmployee);
                      if (!employee) return null;
                      
                      const calc = calculatePayrollForEmployee(
                        employee,
                        parseFloat(newPayrollData.hoursWorked),
                        newPayrollData.overtimeHours ? parseFloat(newPayrollData.overtimeHours) : 0,
                        newPayrollData.bonusAmount ? parseFloat(newPayrollData.bonusAmount) : 0
                      );

                      return (
                        <div className="bg-neutral-800/50 p-4 rounded-lg space-y-2 border border-neutral-700">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Employee:</span>
                            <span className="font-medium text-white">{employee.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Hourly Rate:</span>
                            <span className="font-medium text-white">{formatCurrency(calc.hourlyRate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Gross Pay:</span>
                            <span className="font-medium text-white">{formatCurrency(calc.grossPay)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Deductions:</span>
                            <span className="font-medium text-red-400">-{formatCurrency(calc.totalDeductions)}</span>
                          </div>
                          <div className="flex justify-between border-t border-neutral-700 pt-2">
                            <span className="font-medium text-white">Net Pay:</span>
                            <span className="font-bold text-green-400">{formatCurrency(calc.netPay)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatePayrollOpen(false)} className="bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePayroll}
                    disabled={!selectedEmployee || !newPayrollData.payPeriodStart || !newPayrollData.payPeriodEnd || !newPayrollData.hoursWorked}
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    Create Payroll Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Total Gross Pay</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(summary.totalGrossPay)}
                </p>
                <p className="text-xs text-neutral-400">
                  All time total
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/20">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Active Employees</p>
                <p className="text-2xl font-bold text-white">
                  {activeEmployees.length}
                </p>
                <p className="text-xs text-neutral-400">Ready for payroll</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/20">
                <Users className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Pending Entries</p>
                <p className="text-2xl font-bold text-white">
                  {summary.pendingPayroll}
                </p>
                <p className="text-xs text-neutral-400">
                  Draft status
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-xl border border-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-400">Paid Entries</p>
                <p className="text-2xl font-bold text-white">
                  {summary.paidPayroll}
                </p>
                <p className="text-xs text-green-400">Completed</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList className="bg-neutral-900/50 border-neutral-800">
          <TabsTrigger value="payroll" className="data-[state=active]:bg-neutral-800">Employee Payroll</TabsTrigger>
          <TabsTrigger value="runs" className="data-[state=active]:bg-neutral-800">Payroll History</TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-neutral-800">Employee Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          {/* Filters */}
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                {departments.length > 0 && (
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-48 bg-neutral-900 border-neutral-700 text-white">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700">
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept || ''}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-neutral-900 border-neutral-700 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Table */}
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-white">Payroll Entries</CardTitle>
              <CardDescription className="text-neutral-400">
                All payroll entries for current period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayroll.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-neutral-400">No payroll entries found</p>
                  <p className="text-sm text-neutral-500">
                    Create a payroll entry to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800">
                      <TableHead className="text-neutral-300">Employee</TableHead>
                      <TableHead className="text-neutral-300">Department</TableHead>
                      <TableHead className="text-neutral-300">Pay Period</TableHead>
                      <TableHead className="text-neutral-300">Hours</TableHead>
                      <TableHead className="text-neutral-300">Gross Pay</TableHead>
                      <TableHead className="text-neutral-300">Net Pay</TableHead>
                      <TableHead className="text-neutral-300">Status</TableHead>
                      <TableHead className="text-neutral-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayroll.map((entry) => (
                      <TableRow key={entry.id} className="border-neutral-800 hover:bg-neutral-800/30">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{entry.employee_name}</p>
                            <p className="text-xs text-neutral-500">{entry.employee_position}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-300">{entry.department || '-'}</TableCell>
                        <TableCell className="text-neutral-300">
                          {new Date(entry.pay_period_start).toLocaleDateString()} - {new Date(entry.pay_period_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-neutral-300">{entry.hours_worked}</TableCell>
                        <TableCell className="font-medium text-white">{formatCurrency(entry.gross_pay)}</TableCell>
                        <TableCell className="font-medium text-green-400">{formatCurrency(entry.net_pay)}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="hover:bg-neutral-800">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {entry.status === 'draft' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => processPayrollEntry(entry.id)}
                                className="hover:bg-neutral-800"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {entry.status === 'processed' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => payPayrollEntry(entry.id)}
                                className="hover:bg-neutral-800 text-green-400"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <PayrollHistory payrollEntries={payrollEntries} formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
            <CardHeader>
              <CardTitle className="text-white">Employee Payroll Setup</CardTitle>
              <CardDescription className="text-neutral-400">
                Configure employee pay rates and deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-neutral-400">No active employees</p>
                  <p className="text-sm text-neutral-500">
                    Add employees to start managing payroll
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800">
                      <TableHead className="text-neutral-300">Employee</TableHead>
                      <TableHead className="text-neutral-300">Position</TableHead>
                      <TableHead className="text-neutral-300">Pay Type</TableHead>
                      <TableHead className="text-neutral-300">Hourly Rate</TableHead>
                      <TableHead className="text-neutral-300">Annual Salary</TableHead>
                      <TableHead className="text-neutral-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEmployees.map((employee) => (
                      <TableRow key={employee.id} className="border-neutral-800 hover:bg-neutral-800/30">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{employee.name}</p>
                            <p className="text-xs text-neutral-500">{employee.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-300">{employee.position || '-'}</TableCell>
                        <TableCell className="text-neutral-300 capitalize">{employee.pay_type || 'hourly'}</TableCell>
                        <TableCell className="text-neutral-300">{employee.hourly_rate ? formatCurrency(employee.hourly_rate) : '-'}</TableCell>
                        <TableCell className="text-neutral-300">{employee.annual_salary ? formatCurrency(employee.annual_salary) : '-'}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
