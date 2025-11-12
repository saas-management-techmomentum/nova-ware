
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';

interface RemoveEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RemoveEmployeeDialog = ({ open, onOpenChange }: RemoveEmployeeDialogProps) => {
  const { employees, removeEmployee } = useEmployees();
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [confirmationText, setConfirmationText] = useState('');

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleRemove = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee to remove",
        variant: "destructive",
      });
      return;
    }

    if (confirmationText !== 'REMOVE') {
      toast({
        title: "Error",
        description: "Please type 'REMOVE' to confirm",
        variant: "destructive",
      });
      return;
    }

    try {
      await removeEmployee(selectedEmployeeId);
      setSelectedEmployeeId('');
      setConfirmationText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing employee:', error);
    }
  };

  const handleCancel = () => {
    setSelectedEmployeeId('');
    setConfirmationText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Remove Employee
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <p className="text-red-300 text-sm">
              Warning: This action cannot be undone. The employee will be permanently removed from the system.
            </p>
          </div>

          <div>
            <Label htmlFor="employee-select">Select Employee to Remove</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                <SelectValue placeholder="Choose an employee..." />
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

          {selectedEmployee && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Employee Details:</h4>
              <div className="space-y-1 text-sm text-slate-300">
                <p><span className="font-medium">Name:</span> {selectedEmployee.name}</p>
                <p><span className="font-medium">Position:</span> {selectedEmployee.position}</p>
                <p><span className="font-medium">Initials:</span> {selectedEmployee.initials}</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="confirmation">
              Type "REMOVE" to confirm deletion
            </Label>
            <input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 mt-1"
              placeholder="Type REMOVE here..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={!selectedEmployeeId || confirmationText !== 'REMOVE'}
            >
              Remove Employee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveEmployeeDialog;
