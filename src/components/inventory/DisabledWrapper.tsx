
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DisabledWrapperProps {
  disabled: boolean;
  children: React.ReactElement;
  tooltipContent?: string;
}

const DisabledWrapper: React.FC<DisabledWrapperProps> = ({ 
  disabled, 
  children, 
  tooltipContent = "This action is not available in Corporate Overview mode" 
}) => {
  if (!disabled) {
    return children;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            {React.cloneElement(children, { 
              disabled: true,
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DisabledWrapper;
