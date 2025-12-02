import { InventoryItem, InventoryTransaction, PredictionResult } from "@/types/inventory";
import { addDays, differenceInDays, isAfter, isBefore, subDays, format } from "date-fns";

// Helper function to map raw database transactions to the expected format
export const mapTransactionsForPrediction = (rawTransactions: any[]): InventoryTransaction[] => {
  return rawTransactions
    .map(transaction => ({
      ...transaction,
      date: transaction.created_at || transaction.date,
      itemId: transaction.product_id,
      quantity: Math.abs(transaction.quantity || 0),
      type: transaction.transaction_type === 'outgoing' ? 'outgoing' : 'incoming',
      id: transaction.id,
      unitPrice: transaction.unit_price || 0,
      reference: transaction.reference || 'N/A'
    }))
    .filter(transaction => {
      const date = new Date(transaction.date);
      return !isNaN(date.getTime()) && transaction.itemId && transaction.quantity > 0;
    });
};

// Extract best selling items from predictions and transactions
export const getBestSellersFromPredictions = (
  predictions: PredictionResult[], 
  transactions: InventoryTransaction[],
  inventoryItems: InventoryItem[]
): { id: string; name: string; sku: string; totalSold: number; totalRevenue: number; currentStock: number }[] => {
  // Calculate sales data from transactions
  const salesMap = new Map<string, { totalSold: number; totalRevenue: number }>();
  
  transactions
    .filter(t => t.type === 'outgoing')
    .forEach(t => {
      const existing = salesMap.get(t.itemId) || { totalSold: 0, totalRevenue: 0 };
      salesMap.set(t.itemId, {
        totalSold: existing.totalSold + t.quantity,
        totalRevenue: existing.totalRevenue + (t.quantity * (t.unitPrice || 0))
      });
    });

  // Combine with inventory data and sort by sales
  return Array.from(salesMap.entries())
    .map(([itemId, sales]) => {
      const item = inventoryItems.find(i => i.id === itemId);
      if (!item) return null;
      return {
        id: itemId,
        name: item.name,
        sku: item.sku,
        totalSold: sales.totalSold,
        totalRevenue: sales.totalRevenue,
        currentStock: item.stock
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.totalSold - a!.totalSold)
    .slice(0, 5) as any[];
};

// Extract slow moving items from predictions
export const getSlowMoversFromPredictions = (
  predictions: PredictionResult[],
  transactions: InventoryTransaction[],
  inventoryItems: InventoryItem[]
): { id: string; name: string; sku: string; totalSold: number; totalRevenue: number; currentStock: number }[] => {
  // Calculate sales data from transactions
  const salesMap = new Map<string, { totalSold: number; totalRevenue: number }>();
  
  transactions
    .filter(t => t.type === 'outgoing')
    .forEach(t => {
      const existing = salesMap.get(t.itemId) || { totalSold: 0, totalRevenue: 0 };
      salesMap.set(t.itemId, {
        totalSold: existing.totalSold + t.quantity,
        totalRevenue: existing.totalRevenue + (t.quantity * (t.unitPrice || 0))
      });
    });

  // Find items with stock but low sales velocity
  return inventoryItems
    .filter(item => item.stock > 0)
    .map(item => {
      const sales = salesMap.get(item.id) || { totalSold: 0, totalRevenue: 0 };
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        totalSold: sales.totalSold,
        totalRevenue: sales.totalRevenue,
        currentStock: item.stock
      };
    })
    .sort((a, b) => {
      // Sort by sales velocity (sold per stock ratio), then by stock level
      const aVelocity = a.currentStock > 0 ? a.totalSold / a.currentStock : 0;
      const bVelocity = b.currentStock > 0 ? b.totalSold / b.currentStock : 0;
      
      if (aVelocity !== bVelocity) {
        return aVelocity - bVelocity; // Lower velocity first
      }
      return b.currentStock - a.currentStock; // Higher stock first
    })
    .slice(0, 5);
};

// Check if we have sufficient data age - STRICT 30 day requirement for AI predictions
export const checkDataSufficiency = (transactions: InventoryTransaction[]): {
  hasSufficientData: boolean;
  dataAge: number;
  daysWithData: number;
  daysUntilReady: number;
  message: string;
} => {

  
  if (transactions.length === 0) {
    return {
      hasSufficientData: false,
      dataAge: 0,
      daysWithData: 0,
      daysUntilReady: 30,
      message: "No transaction data available yet. Start using the system to collect data for AI predictions."
    };
  }

  const today = new Date();
  
  // Filter out transactions with invalid dates - enhanced validation for Supabase data
  const validTransactions = transactions.filter(transaction => {
    const date = transaction.date;
    
    // Enhanced date validation to handle various formats
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      // Try multiple parsing methods for Supabase timestamp formats
      const dateString = date as string;
      validDate = new Date(dateString);
      
      // If basic parsing fails, try to clean up the timestamp
      if (isNaN(validDate.getTime())) {
        // Remove microseconds if present (like ".435544") and try again
        const cleanedDate = dateString.replace(/\.\d{6}/, '');
        validDate = new Date(cleanedDate);
      }
    } else if (typeof date === 'number') {
      // Handle timestamp numbers
      validDate = new Date(date);
    } else {
      console.warn('Unsupported date type for transaction:', transaction.id, 'date:', date, 'type:', typeof date);
      return false;
    }
    
    const isValidDate = validDate && !isNaN(validDate.getTime()) && validDate.getTime() > 0;
    
    if (!isValidDate) {
      console.warn('Invalid transaction date:', date, 'for transaction:', transaction.id, 'parsed as:', validDate);
    } 
    
    return isValidDate;
  });
  
 
  
  if (validTransactions.length === 0) {
    return {
      hasSufficientData: false,
      dataAge: 0,
      daysWithData: 0,
      daysUntilReady: 30,
      message: "No valid transaction data available yet. Start using the system to collect data for AI predictions."
    };
  }
  
  // Find oldest transaction with proper Date comparison
  const oldestTransaction = validTransactions.reduce((oldest, transaction) => {
    const transactionTime = new Date(transaction.date).getTime();
    const oldestTime = new Date(oldest.date).getTime();
    return transactionTime < oldestTime ? transaction : oldest;
  }, validTransactions[0]);
  
  const newestTransaction = validTransactions.reduce((newest, transaction) => {
    const transactionTime = new Date(transaction.date).getTime();
    const newestTime = new Date(newest.date).getTime();
    return transactionTime > newestTime ? transaction : newest;
  }, validTransactions[0]);
  

  
  const oldestDate = new Date(oldestTransaction.date);
  
  // Manual date calculation to avoid timezone issues
  const todayMs = today.getTime();
  const oldestMs = oldestDate.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const dataAge = Math.floor((todayMs - oldestMs) / msPerDay);
  
  
  const daysUntilReady = Math.max(0, 30 - dataAge);
  
  // STRICT 30 day requirement - no fallbacks for partial data
  const hasSufficientData = dataAge >= 30;
  
  
  return {
    hasSufficientData,
    dataAge,
    daysWithData: dataAge,
    daysUntilReady,
    message: hasSufficientData 
      ? `AI has ${dataAge} days of comprehensive data with ${validTransactions.length} transactions - predictions are highly accurate`
      : `Collecting data for ${dataAge} days (${validTransactions.length} transactions). ${daysUntilReady} more days needed for optimal AI predictions.`
  };
};

export const generateInventoryPredictions = (
  inventoryItems: InventoryItem[],
  transactions: InventoryTransaction[],
  daysToAnalyze: number = 90,
  minTransactionsRequired: number = 2
): PredictionResult[] => {

  // Map transactions to the expected format if needed
  const mappedTransactions = Array.isArray(transactions) && transactions.length > 0 && !transactions[0].itemId 
    ? mapTransactionsForPrediction(transactions)
    : transactions;

  // Check data sufficiency first - but allow basic predictions with partial data
  const dataSufficiency = checkDataSufficiency(mappedTransactions);
  if (!dataSufficiency.hasSufficientData) {
    return []; // Return empty array when insufficient data
  }


  const predictions: PredictionResult[] = [];
  const today = new Date();
  const startDate = subDays(today, daysToAnalyze);
  
  // Create a cache for item transactions to avoid repeated filtering
  const itemTransactionsCache = new Map<string, InventoryTransaction[]>();
  
  // Pre-filter all transactions within the analysis period
  const relevantTransactions = mappedTransactions.filter(t => 
    isAfter(t.date, startDate) && isBefore(t.date, today)
  );

  
  // Calculate number of weeks in analysis period
  const weeksToAnalyze = daysToAnalyze / 7;
  
  inventoryItems.forEach(item => {
    
    // Get cached transactions or filter and cache them
    let itemTransactions = itemTransactionsCache.get(item.id);
    if (!itemTransactions) {
      itemTransactions = relevantTransactions.filter(t => t.itemId === item.id);
      itemTransactionsCache.set(item.id, itemTransactions);
    }
    
  
    
    // Get outgoing transactions (sales)
    const outgoingTransactions = itemTransactions.filter(t => t.type === 'outgoing');
    
   
    
    // Skip items with insufficient transaction history
    if (outgoingTransactions.length < minTransactionsRequired) {
    
      return;
    }
    
    // Analyze usage patterns by week to detect trends
    const weeklyUsageData = analyzeWeeklyUsagePatterns(outgoingTransactions, daysToAnalyze);
    
    // Calculate total units sold
    const totalUnitsSold = outgoingTransactions.reduce((sum, t) => sum + t.quantity, 0);
    
    // Calculate weekly usage rate based on trend analysis
    const baseWeeklyUsageRate = totalUnitsSold / weeksToAnalyze;
    
   
    
    // Apply trend adjustment factor (increase or decrease based on recent trends)
    const weeklyUsageRate = applyUsageTrendFactor(baseWeeklyUsageRate, weeklyUsageData);
    
    
    
    // Skip items with no usage
    if (weeklyUsageRate <= 0) {

      return;
    }
    
    // Calculate weeks until restock needed based on trend-adjusted usage rate
    const weeksUntilRestock = weeklyUsageRate > 0 ? item.stock / weeklyUsageRate : Infinity;
    
    // Convert weeks to days for date calculation
    const daysUntilRestock = Math.floor(weeksUntilRestock * 7);
    
    // Calculate predicted restock date
    const predictedRestockDate = addDays(today, daysUntilRestock);
    
    // Determine urgency level based on weeks
    let restockUrgency: 'critical' | 'warning' | 'normal' = 'normal';
    if (weeksUntilRestock <= 1) {
      restockUrgency = 'critical';
    } else if (weeksUntilRestock <= 2) {
      restockUrgency = 'warning';
    }
    
    // Calculate prediction confidence based on transaction consistency and pattern stability
    const confidence = calculatePredictionConfidence(
      outgoingTransactions, 
      weeklyUsageData.coefficientOfVariation
    );
    
    // Calculate suggested order quantity (4 weeks supply, adjusted for trend)
    const suggestedOrderQuantity = Math.ceil(weeklyUsageRate * 4);
    
    
    predictions.push({
      itemId: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: item.stock,
      dailyUsageRate: weeklyUsageRate / 7, // Keep this for compatibility
      weeklyUsageRate, // Added for new weekly display
      daysUntilRestock,
      predictedRestockDate,
      restockUrgency,
      confidence: Number((confidence * 100).toFixed(0)),
      suggestedOrderQuantity
    });
  });
  
  
  // Sort by urgency (critical first, then by days until restock)
  return predictions.sort((a, b) => {
    if (a.restockUrgency !== b.restockUrgency) {
      if (a.restockUrgency === 'critical') return -1;
      if (b.restockUrgency === 'critical') return 1;
      if (a.restockUrgency === 'warning') return -1;
      if (b.restockUrgency === 'warning') return 1;
    }
    return a.daysUntilRestock - b.daysUntilRestock;
  });
};

/**
 * Analyze weekly usage patterns to detect trends
 */
const analyzeWeeklyUsagePatterns = (
  transactions: InventoryTransaction[],
  daysToAnalyze: number
) => {
  const today = new Date();
  const startDate = subDays(today, daysToAnalyze);
  
  // Group transactions by week
  const weeklyUsage: Record<string, number> = {};
  const numWeeks = Math.ceil(daysToAnalyze / 7);
  
  // Initialize all weeks with zero
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = subDays(today, (i + 1) * 7);
    const weekKey = format(weekStart, 'yyyy-ww');
    weeklyUsage[weekKey] = 0;
  }
  
  // Sum usage by week
  transactions.forEach(t => {
    const weekKey = format(t.date, 'yyyy-ww');
    weeklyUsage[weekKey] = (weeklyUsage[weekKey] || 0) + t.quantity;
  });
  
  // Convert to array for analysis
  const weeklyData = Object.values(weeklyUsage);
  
  // Calculate trend (regression slope)
  let trend = 0;
  if (weeklyData.length >= 3) {
    trend = calculateTrendSlope(weeklyData);
  }
  
  // Calculate coefficient of variation to assess consistency
  const mean = weeklyData.reduce((sum, val) => sum + val, 0) / weeklyData.length;
  const squaredDiffs = weeklyData.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / weeklyData.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
  
  // Calculate recent vs older usage to detect shifts
  const recentWeeks = weeklyData.slice(0, Math.min(4, weeklyData.length));
  const olderWeeks = weeklyData.slice(Math.min(4, weeklyData.length));
  
  const recentAvg = recentWeeks.length > 0 
    ? recentWeeks.reduce((sum, val) => sum + val, 0) / recentWeeks.length 
    : 0;
    
  const olderAvg = olderWeeks.length > 0 
    ? olderWeeks.reduce((sum, val) => sum + val, 0) / olderWeeks.length 
    : recentAvg; // fallback to recent if no older data
  
  const usageShift = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  
  return {
    trend,
    coefficientOfVariation,
    usageShift,
    weeklyData
  };
};

/**
 * Calculate the slope of the trend line using linear regression
 */
const calculateTrendSlope = (data: number[]): number => {
  const n = data.length;
  if (n <= 1) return 0;
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i];
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  
  // Calculate slope of the regression line
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Normalize the slope to be a percentage of the mean
  const mean = sumY / n;
  return mean !== 0 ? slope / mean : 0;
};

/**
 * Apply a trend adjustment factor to the base usage rate
 */
const applyUsageTrendFactor = (
  baseRate: number,
  weeklyData: { trend: number; usageShift: number; coefficientOfVariation: number }
): number => {
  // Combine trend and recent usage shift to adjust the base rate
  // Limit the adjustment factor to reasonable bounds (-30% to +50%)
  const trendWeight = 0.6;
  const shiftWeight = 0.4;
  
  const combinedTrendFactor = 
    (weeklyData.trend * trendWeight) + 
    (weeklyData.usageShift * shiftWeight);
  
  const boundedTrendFactor = Math.max(-0.3, Math.min(0.5, combinedTrendFactor));
  
  // Apply the trend factor to the base rate
  return baseRate * (1 + boundedTrendFactor);
};

/**
 * Calculate prediction confidence based on transaction history and pattern stability
 */
const calculatePredictionConfidence = (
  transactions: InventoryTransaction[],
  coefficientOfVariation: number
): number => {
  // Base confidence on number of transactions (more data = higher confidence)
  const transactionCountFactor = Math.min(transactions.length / 30, 0.6);
  
  // Consistency factor (lower variation = higher confidence)
  // CV ranges: <0.3 is consistent, >0.5 is highly variable
  const consistencyFactor = Math.max(0, 0.4 - (coefficientOfVariation * 0.5));
  
  // Combine factors for overall confidence
  const confidence = Math.min(transactionCountFactor + consistencyFactor, 0.95);
  
  return confidence;
};
