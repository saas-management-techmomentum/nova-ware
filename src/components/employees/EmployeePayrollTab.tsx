
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  hoursWorked: number;
  hourlyRate: number;
  overtimeHours: number;
  overtimeRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  payPeriod: string;
  status: 'pending' | 'processed' | 'paid';
  payDate?: string;
}

const EmployeePayrollTab = () => {
  const { employees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock payroll data - in a real app, this would come from a hook or API
  const mockPayrollEntries: PayrollEntry[] = employees.map((employee, index) => ({
    id: `payroll-${employee.id}`,
    employeeId: employee.id,
    employeeName: employee.name,
    position: employee.position || 'Staff',
    hoursWorked: 40 + (index % 3) * 5,
    hourlyRate: 15 + (index % 5) * 2.5,
    overtimeHours: index % 2 === 0 ? 5 : 0,
    overtimeRate: (15 + (index % 5) * 2.5) * 1.5,
    grossPay: 0, // Will be calculated
    deductions: 120 + (index % 4) * 30,
    netPay: 0, // Will be calculated
    payPeriod: '12/01/2024 - 12/15/2024',
    status: ['pending', 'processed', 'paid'][index % 3] as 'pending' | 'processed' | 'paid',
    payDate: index % 3 === 2 ? '12/16/2024' : undefined
  })).map(entry => {
    entry.grossPay = (entry.hoursWorked * entry.hourlyRate) + (entry.overtimeHours * entry.overtimeRate);
    entry.netPay = entry.grossPay - entry.deductions;
    return entry;
  });

  const filteredPayroll = mockPayrollEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case 'processed':
        return <Badge className="bg-gray-700 text-white">Processed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processed':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Payroll Management</h2>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-800 hover:bg-gray-900">
                <Plus className="h-4 w-4 mr-2" />
                Add Payroll Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add Payroll Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hours Worked</Label>
                    <Input
                      type="number"
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="40"
                    />
                  </div>
                  <div>
                    <Label>Hourly Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="15.00"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button className="bg-gray-800 hover:bg-gray-900">
                    Add Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payroll Entries */}
      {filteredPayroll.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-16 w-16 mb-4 text-slate-500" />
            <p className="text-lg font-medium mb-2 text-white">No Payroll Entries</p>
            <p className="text-sm text-slate-400 text-center max-w-md">
              {searchTerm || statusFilter !== 'all' 
                ? 'No payroll entries match your current filters.'
                : 'Add your first payroll entry to get started with payroll management.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPayroll.map((entry) => (
            <Card key={entry.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(entry.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{entry.employeeName}</h3>
                        <p className="text-sm text-slate-400">{entry.position}</p>
                      </div>
                      {getStatusBadge(entry.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Pay Period</p>
                        <p className="text-white font-medium">{entry.payPeriod}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Hours Worked</p>
                        <p className="text-white font-medium">
                          {entry.hoursWorked}h
                          {entry.overtimeHours > 0 && (
                            <span className="text-orange-400"> (+{entry.overtimeHours}h OT)</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Gross Pay</p>
                        <p className="text-white font-medium">${entry.grossPay.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Net Pay</p>
                        <p className="text-green-400 font-bold">${entry.netPay.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {entry.payDate && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-400">Paid on: </span>
                        <span className="text-white">{entry.payDate}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeePayrollTab;
