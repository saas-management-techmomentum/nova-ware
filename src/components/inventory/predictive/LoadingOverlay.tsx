
import React from 'react';
import { Brain, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LoadingOverlayProps {
  dataAge: number;
  transactionCount: number;
  daysUntilReady: number;
  message: string;
}

const LoadingOverlay = ({ dataAge, transactionCount, daysUntilReady, message }: LoadingOverlayProps) => {
  const progressPercentage = Math.min(100, (dataAge / 30) * 100);
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-slate-950/40 to-purple-950/20" />
      
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-screen overflow-y-auto">
        <Card className="bg-slate-900/40 border-slate-700/50 backdrop-blur-md shadow-2xl">
          <CardContent className="p-4 sm:p-6 text-center">
            {/* AI Brain Icon with Pulse Animation */}
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse opacity-20" />
              <div className="absolute inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white animate-pulse" />
              </div>
              
              {/* Circular Progress Ring */}
              <svg className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="3"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Main Status */}
            <div className="mb-4 sm:mb-6">
              <Badge className="mb-2 sm:mb-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-2 sm:px-3 py-1 text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI Learning in Progress
              </Badge>
              
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3">
                Training Predictive Models
              </h2>
              
              <p className="text-slate-300 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                {message}
              </p>
            </div>

            {/* Progress Stats - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2 mb-4 sm:mb-6">
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-2 border border-slate-700/30">
                <div className="flex items-center justify-center mb-1 sm:mb-1">
                  <Clock className="h-3 w-3 text-indigo-400 mr-1" />
                  <span className="text-slate-400 text-xs">Data Collection</span>
                </div>
                <div className="text-xl sm:text-lg font-bold text-white">{dataAge}</div>
                <div className="text-slate-400 text-xs">of 30 days</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-2 border border-slate-700/30">
                <div className="flex items-center justify-center mb-1 sm:mb-1">
                  <TrendingUp className="h-3 w-3 text-purple-400 mr-1" />
                  <span className="text-slate-400 text-xs">Transactions</span>
                </div>
                <div className="text-xl sm:text-lg font-bold text-white">{transactionCount}</div>
                <div className="text-slate-400 text-xs">data points</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-2 border border-slate-700/30">
                <div className="flex items-center justify-center mb-1 sm:mb-1">
                  <BarChart3 className="h-3 w-3 text-emerald-400 mr-1" />
                  <span className="text-slate-400 text-xs">Time Remaining</span>
                </div>
                <div className="text-xl sm:text-lg font-bold text-white">{daysUntilReady}</div>
                <div className="text-slate-400 text-xs">days</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-xs">Learning Progress</span>
                <span className="text-indigo-400 font-medium text-xs">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Learning Indicators - Responsive Layout */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">AI is Learning</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse flex-shrink-0" />
                  <span className="text-slate-300 text-xs">Inventory patterns</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse flex-shrink-0" />
                  <span className="text-slate-300 text-xs">Demand fluctuations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 animate-pulse flex-shrink-0" />
                  <span className="text-slate-300 text-xs">Seasonal trends</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 animate-pulse flex-shrink-0" />
                  <span className="text-slate-300 text-xs">Reorder points</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="p-3 bg-indigo-950/30 rounded border border-indigo-500/20">
              <p className="text-indigo-200 text-xs text-left">
                <strong>Note:</strong> AI requires comprehensive historical data for accurate predictions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingOverlay;
