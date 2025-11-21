import React from 'react';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, TrendingUp, Minus, Brain } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PredictionResult } from '@/types/inventory';

interface PredictionTableProps {
  predictions: PredictionResult[];
  getUrgencyBadge: (urgency: 'critical' | 'warning' | 'normal') => JSX.Element;
  isLowStockContext?: boolean;
}

const PredictionTable = ({ predictions, getUrgencyBadge, isLowStockContext = false }: PredictionTableProps) => {
  // Function to safely format dates
  const formatPredictedDate = (date: Date) => {
    if (!date || !isValid(date)) {
      return 'Invalid Date';
    }
    try {
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return 'Invalid Date';
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-neutral-900/90">
          <TableRow className="border-neutral-800">
            <TableHead className="text-neutral-300 font-medium">Product</TableHead>
            <TableHead className="text-neutral-300 font-medium">Current Stock</TableHead>
            <TableHead className="text-neutral-300 font-medium">AI Usage Rate</TableHead>
            <TableHead className="text-neutral-300 font-medium">Trend Analysis</TableHead>
            <TableHead className="text-neutral-300 font-medium">AI Forecast</TableHead>
            <TableHead className="text-neutral-300 font-medium">Restock Date</TableHead>
            <TableHead className="text-neutral-300 font-medium">AI Status</TableHead>
            <TableHead className="text-neutral-300 font-medium">ML Confidence</TableHead>
            <TableHead className="text-neutral-300 font-medium">Smart Order Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {predictions.length > 0 ? (
            predictions.map((prediction) => (
              <TableRow key={prediction.itemId} className="border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                <TableCell className="text-white">
                  <div className="font-medium flex items-center">
                    {prediction.name}
                    <Badge className="ml-2 bg-gray-700/20 text-neutral-300 border-neutral-600/30 text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">SKU: {prediction.sku}</div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <span className="text-neutral-300 font-medium">
                    {prediction.weeklyUsageRate > 0 ? prediction.weeklyUsageRate.toFixed(1) : '0.0'}/week
                  </span>
                </TableCell>
                <TableCell>
                  {getTrendIndicator(prediction)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`
                    ${prediction.daysUntilRestock <= 7 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                     prediction.daysUntilRestock <= 14 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'} 
                    font-medium`}
                  >
                    {prediction.daysUntilRestock} days
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-neutral-300">
                    {formatPredictedDate(prediction.predictedRestockDate)}
                  </span>
                </TableCell>
                <TableCell>
                  {getUrgencyBadge(prediction.restockUrgency)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={prediction.confidence} className="h-2 w-16" />
                    <span className="text-neutral-300">{prediction.confidence}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-700/20 text-neutral-300 border-neutral-600/30 font-medium">
                    {prediction.suggestedOrderQuantity} units
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="border-neutral-800">
              <TableCell colSpan={9} className="text-center py-8 text-neutral-400">
                No products match your current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PredictionTable;
