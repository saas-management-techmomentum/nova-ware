
import React from 'react';
import { AlertTriangle, Clock, PackageCheck, Brain, Zap, Target } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SummaryCardsProps {
  criticalCount: number;
  warningCount: number;
  normalCount: number;
}

const SummaryCards = ({ criticalCount, warningCount, normalCount }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-neutral-800/50 backdrop-blur-md border border-red-700/30 shadow-md overflow-hidden relative">
        <div className="absolute top-2 right-2">
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
            <Brain className="h-3 w-3 mr-1" />
            AI Alert
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-white">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
            Critical Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-red-400">{criticalCount}</span>
            <div className="text-right">
              <div className="text-neutral-400 text-sm">AI Detected</div>
              <div className="text-neutral-400 text-xs">Immediate action required</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-neutral-800/50 backdrop-blur-md border border-amber-700/30 shadow-md overflow-hidden relative">
        <div className="absolute top-2 right-2">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Smart Alert
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-white">
            <Clock className="h-5 w-5 mr-2 text-amber-400" />
            AI Replenishment Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-amber-400">{warningCount}</span>
            <div className="text-right">
              <div className="text-neutral-400 text-sm">Predicted</div>
              <div className="text-neutral-400 text-xs">Schedule procurement</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-neutral-800/50 backdrop-blur-md border border-emerald-700/30 shadow-md overflow-hidden relative">
        <div className="absolute top-2 right-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
            <Target className="h-3 w-3 mr-1" />
            AI Optimized
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-white">
            <PackageCheck className="h-5 w-5 mr-2 text-emerald-400" />
            Optimal AI Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-emerald-400">{normalCount}</span>
            <div className="text-right">
              <div className="text-neutral-400 text-sm">AI Verified</div>
              <div className="text-neutral-400 text-xs">Balanced inventory</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
