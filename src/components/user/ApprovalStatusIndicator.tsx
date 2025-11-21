import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock } from 'lucide-react';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';

const ApprovalStatusIndicator: React.FC = () => {
  const { approvalStatus, loading } = useApprovalStatus();
  
  if (loading) {
    return null;
  }
  
  if (!approvalStatus || approvalStatus === 'approved') {
    return null; // Don't show anything for approved users
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return {
          icon: Clock,
          variant: 'secondary' as const,
          text: 'Approval Pending',
          description: 'Your account access is pending admin approval. You can still access data.'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          variant: 'destructive' as const,
          text: 'Access Denied',
          description: 'Please contact your administrator for access.'
        };
      default:
        return {
          icon: AlertCircle,
          variant: 'secondary' as const,
          text: 'Unknown Status',
          description: 'Contact your administrator for status clarification.'
        };
    }
  };

  const config = getStatusConfig(approvalStatus);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 border rounded-md">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <Badge variant={config.variant} className="text-xs">
          {config.text}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {config.description}
        </p>
      </div>
    </div>
  );
};

export default ApprovalStatusIndicator;