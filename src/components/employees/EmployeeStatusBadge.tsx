import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Employee } from '@/hooks/useEmployees';

interface EmployeeStatusBadgeProps {
  employee: Employee;
  onResendInvitation?: (employeeId: string) => void;
}

export const EmployeeStatusBadge = ({ employee, onResendInvitation }: EmployeeStatusBadgeProps) => {
  const getStatusBadge = () => {
    switch (employee.status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Pending Setup
          </Badge>
        );
      case 'invited':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
              Pending Activation
            </Badge>
            {onResendInvitation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onResendInvitation(employee.id)}
                className="h-6 px-2 text-xs"
                title="Resend invitation email"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Active
          </Badge>
        );
      case 'disabled':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Disabled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Unknown
          </Badge>
        );
    }
  };

  const getStatusText = () => {
    switch (employee.status) {
      case 'pending':
        return 'Account setup required';
      case 'invited':
        return employee.invited_at 
          ? `Invited ${new Date(employee.invited_at).toLocaleDateString()}`
          : 'Email confirmation pending';
      case 'active':
        return 'Account is active';
      case 'disabled':
        return 'Account is disabled';
      default:
        return 'Status unknown';
    }
  };

  return (
    <div className="space-y-1">
      {getStatusBadge()}
      <p className="text-xs text-muted-foreground">{getStatusText()}</p>
    </div>
  );
};