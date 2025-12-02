import { formatDistanceToNow } from 'date-fns';
import { Package, ShoppingCart, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'order':
      return ShoppingCart;
    case 'shipment':
      return Package;
    case 'invoice':
      return FileText;
    case 'task':
      return CheckCircle;
    default:
      return AlertCircle;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'order':
      return 'text-blue-400';
    case 'shipment':
      return 'text-green-400';
    case 'invoice':
      return 'text-purple-400';
    case 'task':
      return 'text-orange-400';
    default:
      return 'text-neutral-400';
  }
};

export const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const Icon = getIcon(notification.type);
  const iconColor = getIconColor(notification.type);

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 hover:bg-neutral-800 cursor-pointer transition-colors border-b border-neutral-700',
        !notification.is_read && 'bg-neutral-900'
      )}
    >
      <div className="flex gap-3">
        <div className={cn('mt-1', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm font-medium',
              notification.is_read ? 'text-neutral-400' : 'text-white'
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};
