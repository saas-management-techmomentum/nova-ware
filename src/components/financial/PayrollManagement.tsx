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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payroll Management</h2>
          <p className="text-muted-foreground mt-1">Manage employee compensation and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreatePayrollOpen} onOpenChange={setIsCreatePayrollOpen}>
            <DialogTrigger asChild>
              <Button disabled={activeEmployees.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Create Payroll Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Payroll Entry</DialogTitle>
                <DialogDescription>
                  Create a new payroll entry for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an employee" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <Label>Pay Period Start</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newPayrollData.payPeriodStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newPayrollData.payPeriodStart ? format(newPayrollData.payPeriodStart, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                    <Label>Pay Period End</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newPayrollData.payPeriodEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newPayrollData.payPeriodEnd ? format(newPayrollData.payPeriodEnd, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                    <Label>Hours Worked</Label>
                    <Input 
                      type="number" 
                      placeholder="40"
                      value={newPayrollData.hoursWorked}
                      onChange={(e) => setNewPayrollData(prev => ({ ...prev, hoursWorked: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Overtime Hours</Label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={newPayrollData.overtimeHours}
                      onChange={(e) => setNewPayrollData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Bonus Amount</Label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={newPayrollData.bonusAmount}
                      onChange={(e) => setNewPayrollData(prev => ({ ...prev, bonusAmount: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Preview calculation if employee and hours are selected */}
                {selectedEmployee && newPayrollData.hoursWorked && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Payroll Preview</h4>
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
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span>Employee:</span>
                            <span className="font-medium">{employee.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Hourly Rate:</span>
                            <span className="font-medium">{formatCurrency(calc.hourlyRate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gross Pay:</span>
                            <span className="font-medium">{formatCurrency(calc.grossPay)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Deductions:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(calc.totalDeductions)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Net Pay:</span>
                            <span className="font-bold text-green-600">{formatCurrency(calc.netPay)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatePayrollOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePayroll}
                    disabled={!selectedEmployee || !newPayrollData.payPeriodStart || !newPayrollData.payPeriodEnd || !newPayrollData.hoursWorked}
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Gross Pay</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalGrossPay)}
                </p>
                <p className="text-xs text-muted-foreground">
                  All time total
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">
                  {activeEmployees.length}
                </p>
                <p className="text-xs text-muted-foreground">Ready for payroll</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending Entries</p>
                <p className="text-2xl font-bold">
                  {summary.pendingPayroll}
                </p>
                <p className="text-xs text-muted-foreground">
                  Draft status
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Paid Entries</p>
                <p className="text-2xl font-bold">
                  {summary.paidPayroll}
                </p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payroll">Employee Payroll</TabsTrigger>
          <TabsTrigger value="runs">Payroll History</TabsTrigger>
          <TabsTrigger value="employees">Employee Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {departments.length > 0 && (
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" disabled={filteredPayroll.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Entries</CardTitle>
              <CardDescription>
                {payrollEntries.length === 0 
                  ? "No payroll entries created yet. Create your first payroll entry to get started."
                  : `Manage payroll entries and payment status (${filteredPayroll.length} of ${payrollEntries.length} entries)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payrollEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No payroll entries yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeEmployees.length === 0 
                      ? "Add employees to your team first, then create payroll entries for them."
                      : "Create your first payroll entry to start managing employee compensation."
                    }
                  </p>
                  {activeEmployees.length > 0 && (
                    <Button onClick={() => setIsCreatePayrollOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Payroll Entry
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayroll.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{entry.employee_position}</div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.department || 'No Department'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(entry.pay_period_start).toLocaleDateString()} - 
                            {new Date(entry.pay_period_end).toLocaleDateString()}
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
                          {getStatusBadge(entry.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => processPayrollEntry(entry.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Process
                              </Button>
                            )}
                            {entry.status === 'processed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => payPayrollEntry(entry.id)}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
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
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <PayrollHistory 
            payrollEntries={payrollEntries}
            formatCurrency={formatCurrency}
            loading={payrollLoading}
          />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll Setup</CardTitle>
              <CardDescription>
                Review employee payroll information and setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <UserX className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No active employees</h3>
                  <p className="text-muted-foreground mb-4">
                    Add employees to your team to set up payroll information.
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Go to Employee Management
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Pay Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Tax Status</TableHead>
                      <TableHead>Benefits</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.position} • {employee.department || 'No Department'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {employee.pay_type === 'hourly' ? 'Hourly' : 'Salary'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employee.hourly_rate 
                            ? `${formatCurrency(employee.hourly_rate)}/hr`
                            : 'Not set'
                          }
                        </TableCell>
                        <TableCell>
                          {employee.tax_withholding_status 
                            ? employee.tax_withholding_status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                            : 'Not set'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            {employee.health_insurance_amount ? (
                              <div>Health: {formatCurrency(employee.health_insurance_amount)}</div>
                            ) : null}
                            {employee.dental_insurance_amount ? (
                              <div>Dental: {formatCurrency(employee.dental_insurance_amount)}</div>
                            ) : null}
                            {employee.retirement_401k_amount ? (
                              <div>401k: {formatCurrency(employee.retirement_401k_amount)}</div>
                            ) : null}
                            {!employee.health_insurance_amount && !employee.dental_insurance_amount && !employee.retirement_401k_amount && (
                              <span className="text-muted-foreground">No benefits</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
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