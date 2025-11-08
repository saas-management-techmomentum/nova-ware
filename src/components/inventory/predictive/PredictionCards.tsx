import React from 'react';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PredictionResult } from '@/types/inventory';

interface PredictionCardsProps {
  predictions: PredictionResult[];
  getUrgencyBadge: (urgency: 'critical' | 'warning' | 'normal') => JSX.Element;
  isLowStockContext?: boolean;
}

const PredictionCards = ({ predictions, getUrgencyBadge, isLowStockContext = false }: PredictionCardsProps) => {
  // Function to safely format dates
  const formatPredictedDate = (date: Date) => {
    if (!date || !isValid(date)) {
      return 'Invalid';
    }
    try {
      return format(date, 'MMM d');
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return 'Invalid';
    }
  };

  // Function to determine trend direction with percentage
  const getTrendIndicator = (prediction: PredictionResult) => {
    // Calculate baseline weekly rate (assuming current stock should last 4 weeks ideally)
    const baselineWeeklyRate = prediction.currentStock / 4;
    const currentWeeklyRate = prediction.weeklyUsageRate;
    
    // Calculate percentage difference from baseline
    const percentageChange = baselineWeeklyRate > 0 
      ? ((currentWeeklyRate - baselineWeeklyRate) / baselineWeeklyRate) * 100
      : 0;
      
    const absChange = Math.abs(percentageChange);
    
    if (percentageChange > 25) {
      return (
        <div className="flex items-center text-red-400">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+{absChange.toFixed(1)}%</span>
        </div>
      );
    } else if (percentageChange < -25) {
      return (
        <div className="flex items-center text-green-400">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>-{absChange.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-neutral-400">
          <Minus className="h-4 w-4 mr-1" />
          <span>{percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%</span>
        </div>
      );
    }
  };

  return (
    <div className="p-4">
      {predictions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {predictions.map((prediction) => (
            <Card key={prediction.itemId} className={`
              ${prediction.restockUrgency === 'critical' ? 'border-red-700/30' : 
              prediction.restockUrgency === 'warning' ? 'border-amber-700/30' : 
              'border-emerald-700/30'} 
              bg-neutral-900/80 overflow-hidden hover:border-neutral-600/30 transition-colors`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-md text-white">{prediction.name}</CardTitle>
                  {getUrgencyBadge(prediction.restockUrgency)}
                </div>
                <div className="text-xs text-neutral-400 mt-1">SKU: {prediction.sku}</div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Warehouse Stock:</span>
                    {isLowStockContext ? (
                      <Badge className="bg-amber-500/90 shadow-sm font-medium">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className={`
                        ${prediction.currentStock <= 5 ? 'bg-red-500/90' : 
                         prediction.currentStock <= 10 ? 'bg-amber-500/90' : 
                         'bg-emerald-500/90'} 
                        shadow-sm font-medium`}
                      >
                        {prediction.currentStock} units
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Weekly Distribution:</span>
                    <span className="text-neutral-300 font-medium">
                      {prediction.weeklyUsageRate > 0 ? prediction.weeklyUsageRate.toFixed(1) : '0.0'}/week
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Usage Trend:</span>
                    {getTrendIndicator(prediction)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Replenish In:</span>
                    <Badge variant="outline" className={`
                      ${prediction.daysUntilRestock <= 7 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                       prediction.daysUntilRestock <= 14 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'} 
                      font-medium`}
                    >
                      {prediction.daysUntilRestock} days
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Procurement Date:</span>
                    <span className="text-neutral-300 text-sm">
                      {formatPredictedDate(prediction.predictedRestockDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Forecast Accuracy:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={prediction.confidence} className="h-2 w-16" />
                      <span className="text-neutral-300 text-sm">{prediction.confidence}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Order Quantity:</span>
                    <Badge variant="outline" className="bg-gray-700/20 text-neutral-300 border-neutral-600/30 font-medium">
                      {prediction.suggestedOrderQuantity} units
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-400">
          No products match your current filters.
        </div>
      )}
    </div>
  );
};

export default PredictionCards;
