import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { format, differenceInDays } from "date-fns";
import { ProductBatch } from "@/types/inventory";

interface ExpirationDisplayProps {
  productExpiration?: Date | string | null;
  batches?: ProductBatch[];
  hasBatches?: boolean;
}

export const ExpirationDisplay: React.FC<ExpirationDisplayProps> = ({
  productExpiration,
  batches = [],
  hasBatches = false
}) => {
  // Helper function to get expiration urgency status
  const getExpirationUrgency = (expirationDate: Date | string | null) => {
    if (!expirationDate) return 'none';
    
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysDiff = differenceInDays(expDate, now);
    
    if (daysDiff < 0) return 'expired';
    if (daysDiff <= 7) return 'critical';
    if (daysDiff <= 30) return 'warning';
    return 'normal';
  };

  // Helper function to get color classes based on urgency (dark theme)
  const getUrgencyClasses = (urgency: string) => {
    switch (urgency) {
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'critical':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'normal':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  // Helper function to format date display
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).toUpperCase();
  };

  // Helper function to get relative time for very close dates
  const getRelativeTimeText = (date: Date | string) => {
    const d = new Date(date);
    const days = differenceInDays(d, new Date());
    
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `${days} days`;
    return formatDate(date);
  };

  // If no batches, show product expiration or none
  if (!hasBatches || batches.length === 0) {
    if (!productExpiration) {
      return (
        <div className="whitespace-nowrap">
          <span className="text-slate-400">No expiration</span>
        </div>
      );
    }
    
    const urgency = getExpirationUrgency(productExpiration);
    const classes = getUrgencyClasses(urgency);
    
    return (
      <div className="whitespace-nowrap">
        <Badge className={`${classes} border rounded-full px-3 py-1`}>
          {formatDate(productExpiration)}
        </Badge>
      </div>
    );
  }

  // Filter batches with expiration dates and sort by earliest
  const batchesWithExpiration = batches
    .filter(batch => batch.expiration_date)
    .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime());

  const batchesWithoutExpiration = batches.filter(batch => !batch.expiration_date);

  // If no batches have expiration dates
  if (batchesWithExpiration.length === 0) {
    return (
      <div className="whitespace-nowrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 border rounded-full px-3 py-1">
                {batches.length} batch{batches.length !== 1 ? 'es' : ''}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-semibold">Batch Expiration Info</div>
                <div className="text-sm">
                  {batchesWithoutExpiration.length} batch{batchesWithoutExpiration.length !== 1 ? 'es' : ''} with no expiration date
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Get the earliest expiration
  const earliestExpiration = batchesWithExpiration[0].expiration_date!;
  const urgency = getExpirationUrgency(earliestExpiration);
  const classes = getUrgencyClasses(urgency);
  
  // Create tooltip content with all batch expiration details
  const tooltipContent = (
    <div className="space-y-2 max-w-sm">
      <div className="font-semibold">All Batch Expiration Dates</div>
      <div className="space-y-1">
        {batchesWithExpiration.map((batch, index) => {
          const batchUrgency = getExpirationUrgency(batch.expiration_date!);
          const isEarliest = index === 0;
          
          return (
            <div key={batch.id} className="flex justify-between items-center text-sm">
              <span className={isEarliest ? 'font-semibold' : ''}>
                {batch.batch_number}
              </span>
              <span className={`
                ${isEarliest ? 'font-semibold' : ''}
                ${batchUrgency === 'expired' ? 'text-red-600' : ''}
                ${batchUrgency === 'critical' ? 'text-orange-600' : ''}
                ${batchUrgency === 'warning' ? 'text-yellow-600' : ''}
                ${batchUrgency === 'normal' ? 'text-green-600' : ''}
              `}>
                {format(new Date(batch.expiration_date!), 'MMM d, yyyy')}
                {batchUrgency === 'expired' && ' (Expired)'}
                {batchUrgency === 'critical' && ' (Critical)'}
              </span>
            </div>
          );
        })}
        {batchesWithoutExpiration.length > 0 && (
          <div className="text-sm text-slate-500 pt-1 border-t">
            {batchesWithoutExpiration.length} batch{batchesWithoutExpiration.length !== 1 ? 'es' : ''} with no expiration
          </div>
        )}
      </div>
    </div>
  );

  // Show earliest expiration with indicator if multiple batches
  const displayText = urgency === 'critical' || urgency === 'expired' 
    ? getRelativeTimeText(earliestExpiration)
    : formatDate(earliestExpiration);

  const additionalBatchesCount = batchesWithExpiration.length - 1;

  return (
    <div className="whitespace-nowrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${classes} border rounded-full px-3 py-1 cursor-help`}>
              {displayText}
              {additionalBatchesCount > 0 && (
                <span className="ml-1 text-xs opacity-75">
                  +{additionalBatchesCount} more
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};