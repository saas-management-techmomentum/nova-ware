import React from 'react';

interface LoadingOverlayProps {
  dataAge: number;
  transactionCount: number;
  daysUntilReady: number;
  message: string;
}

const LoadingOverlay = ({ dataAge, daysUntilReady }: LoadingOverlayProps) => {
  const progressPercentage = Math.min(100, (dataAge / 30) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md px-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Training Predictive Models
        </h2>
        
        <p className="text-neutral-400 text-sm mb-6">
          Collecting data for {dataAge} days. {daysUntilReady} more days needed for optimal predictions.
        </p>
        
        <div className="w-full">
          <div className="flex justify-between text-xs text-neutral-500 mb-2">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5">
            <div 
              className="h-full bg-neutral-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
