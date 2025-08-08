
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface InvoiceStatusBadgeProps {
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  className?: string;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { color: 'bg-green-500 text-white', label: 'Paid' };
      case 'approved':
        return { color: 'bg-blue-500 text-white', label: 'Approved' };
      case 'sent':
        return { color: 'bg-purple-500 text-white', label: 'Sent' };
      case 'overdue':
        return { color: 'bg-red-500 text-white', label: 'Overdue' };
      case 'draft':
        return { color: 'bg-gray-500 text-white', label: 'Draft' };
      case 'cancelled':
        return { color: 'bg-gray-600 text-white', label: 'Cancelled' };
      default:
        return { color: 'bg-slate-500 text-white', label: 'Unknown' };
    }
  };

  const { color, label } = getStatusConfig(status);

  return (
    <Badge className={`${color} ${className}`}>
      {label}
    </Badge>
  );
};
