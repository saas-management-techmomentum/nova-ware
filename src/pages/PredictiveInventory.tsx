import React, { useState, useCallback, useMemo } from 'react';
import { 
  RefreshCw, 
  TrendingDown, 
  BarChart,
  Info,
  Brain,
  Sparkles
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/InventoryContext';
import { checkDataSufficiency, mapTransactionsForPrediction } from '@/utils/inventoryPrediction';
import SearchFilters from '@/components/inventory/predictive/SearchFilters';
import SummaryCards from '@/components/inventory/predictive/SummaryCards';
import PredictionTable from '@/components/inventory/predictive/PredictionTable';
import PredictionCards from '@/components/inventory/predictive/PredictionCards';
import LoadingOverlay from '@/components/inventory/predictive/LoadingOverlay';

const PredictiveInventory = () => {
  // For predictive analysis, we want to see ALL products and transactions regardless of warehouse filtering
  // This gives the AI more comprehensive data to work with
  const { inventoryItems, transactions, generatePredictions, refreshPredictions } = useInventory();
  
  // Debug logging to understand the filtering issue
  React.useEffect(() => {
    console.log('PredictiveInventory Debug:', {
      inventoryItemsCount: inventoryItems.length,
      transactionsCount: transactions.length,
      sampleInventoryItems: inventoryItems.slice(0, 3).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku
      }))
    });
  }, [inventoryItems, transactions]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('urgency');
  
  // Check data sufficiency for AI predictions
  const dataSufficiency = useMemo(() => {
    const mappedTransactions = mapTransactionsForPrediction(transactions);
    const result = checkDataSufficiency(mappedTransactions);
    
    console.log('Data sufficiency result:', {
      hasSufficientData: result.hasSufficientData,
      dataAge: result.dataAge,
      daysUntilReady: result.daysUntilReady,
      transactionCount: mappedTransactions.length,
      message: result.message
    });
    
    return result;
  }, [transactions]);
  
  // Use memoized predictions to avoid recalculating on every render
  const predictions = useMemo(() => {
    if (!dataSufficiency.hasSufficientData) {
      console.log('Skipping prediction generation - insufficient data');
      return []; // No predictions when insufficient data
    }
    console.log('Generating predictions...');
    const result = generatePredictions();
    console.log('Generated predictions:', result.length, result.slice(0, 3));
    return result;
  }, [generatePredictions, dataSufficiency.hasSufficientData]);
  
  // Check if we're in low stock context
  const isLowStockContext = timeFilter === 'warning';
  
  // Memoize filtered predictions
  const filteredPredictions = useMemo(() => {
    return predictions
      .filter(prediction => {
        // Apply search filter
        const matchesSearch = prediction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prediction.sku.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Apply time filter
        const matchesTimeFilter = 
          timeFilter === 'all' ? true :
          timeFilter === 'critical' ? prediction.restockUrgency === 'critical' :
          timeFilter === 'warning' ? prediction.restockUrgency === 'warning' :
          timeFilter === '7days' ? prediction.daysUntilRestock <= 7 :
          timeFilter === '14days' ? prediction.daysUntilRestock <= 14 :
          timeFilter === '30days' ? prediction.daysUntilRestock <= 30 : true;

        // Apply month filter
        const currentDate = new Date();
        const matchesMonthFilter = 
          monthFilter === 'all' ? true :
          monthFilter === 'january' ? currentDate.getMonth() === 0 :
          monthFilter === 'february' ? currentDate.getMonth() === 1 :
          monthFilter === 'march' ? currentDate.getMonth() === 2 :
          monthFilter === 'april' ? currentDate.getMonth() === 3 :
          monthFilter === 'may' ? currentDate.getMonth() === 4 :
          monthFilter === 'june' ? currentDate.getMonth() === 5 :
          monthFilter === 'july' ? currentDate.getMonth() === 6 :
          monthFilter === 'august' ? currentDate.getMonth() === 7 :
          monthFilter === 'september' ? currentDate.getMonth() === 8 :
          monthFilter === 'october' ? currentDate.getMonth() === 9 :
          monthFilter === 'november' ? currentDate.getMonth() === 10 :
          monthFilter === 'december' ? currentDate.getMonth() === 11 : true;

        // Apply week filter
        const getWeekOfYear = (date: Date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        };
        
        const currentWeek = getWeekOfYear(currentDate);
        const matchesWeekFilter = 
          weekFilter === 'all' ? true :
          weekFilter === 'week1' ? currentWeek >= 1 && currentWeek <= 4 :
          weekFilter === 'week5' ? currentWeek >= 5 && currentWeek <= 8 :
          weekFilter === 'week9' ? currentWeek >= 9 && currentWeek <= 12 :
          weekFilter === 'week13' ? currentWeek >= 13 && currentWeek <= 16 :
          weekFilter === 'week17' ? currentWeek >= 17 && currentWeek <= 20 :
          weekFilter === 'week21' ? currentWeek >= 21 && currentWeek <= 24 :
          weekFilter === 'week25' ? currentWeek >= 25 && currentWeek <= 28 :
          weekFilter === 'week29' ? currentWeek >= 29 && currentWeek <= 32 :
          weekFilter === 'week33' ? currentWeek >= 33 && currentWeek <= 36 :
          weekFilter === 'week37' ? currentWeek >= 37 && currentWeek <= 40 :
          weekFilter === 'week41' ? currentWeek >= 41 && currentWeek <= 44 :
          weekFilter === 'week45' ? currentWeek >= 45 && currentWeek <= 48 :
          weekFilter === 'week49' ? currentWeek >= 49 && currentWeek <= 52 : true;
          
        return matchesSearch && matchesTimeFilter && matchesMonthFilter && matchesWeekFilter;
      });
  }, [predictions, searchTerm, timeFilter, monthFilter, weekFilter]);
    
  // Memoize sorted predictions
  const sortedPredictions = useMemo(() => {
    return [...filteredPredictions].sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          // Already sorted by urgency in the utility function
          return 0;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return a.currentStock - b.currentStock;
        case 'usage':
          return b.dailyUsageRate - a.dailyUsageRate;
        case 'confidence':
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });
  }, [filteredPredictions, sortBy]);
  
  // Memoize summary counts
  const { criticalCount, warningCount, normalCount } = useMemo(() => {
    return {
      criticalCount: predictions.filter(p => p.restockUrgency === 'critical').length,
      warningCount: predictions.filter(p => p.restockUrgency === 'warning').length,
      normalCount: predictions.filter(p => p.restockUrgency === 'normal').length
    };
  }, [predictions]);
  
  // Memoize the urgency badge function to avoid recreating it on every render
  const getUrgencyBadge = useCallback((urgency: 'critical' | 'warning' | 'normal') => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-500">Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-500 text-white border-amber-400">Replenish Soon</Badge>;
      case 'normal':
        return <Badge variant="outline" className="bg-emerald-500 text-white border-emerald-500">Optimal</Badge>;
    }
  }, []);
  
  const handleRefreshPredictions = () => {
    console.log('Manually refreshing AI predictions...');
    refreshPredictions();
  };

  // Show loading overlay if data is insufficient
  if (!dataSufficiency.hasSufficientData) {
    console.log('Showing loading overlay - insufficient data');
    return (
      <>
        {/* Render the underlying page content (dimmed) */}
        <div className="space-y-6 animate-fade-in opacity-20 pointer-events-none">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent flex items-center">
              <Brain className="h-6 w-6 mr-2 text-neutral-400" />
              AI-Powered Inventory Forecasting
              <Badge className="ml-3 bg-gradient-to-r from-neutral-700 to-neutral-800 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Engine
              </Badge>
            </h1>
            <p className="text-neutral-400 text-sm">
              Machine learning predictions based on historical distribution patterns and demand trends
            </p>
          </div>
          <Button onClick={handleRefreshPredictions} className="gap-2 bg-gray-800 hover:bg-gray-900" disabled>
              <RefreshCw className="h-4 w-4" />
              Refresh AI Analysis
            </Button>
          </div>
          
          {/* Placeholder content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50">
              <CardContent className="p-6">
                <div className="h-20 bg-neutral-800/30 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50">
              <CardContent className="p-6">
                <div className="h-20 bg-neutral-800/30 rounded animate-pulse"></div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50">
              <CardContent className="p-6">
                <div className="h-20 bg-neutral-800/30 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Loading Overlay */}
        <LoadingOverlay
          dataAge={dataSufficiency.dataAge}
          transactionCount={transactions.length}
          daysUntilReady={dataSufficiency.daysUntilReady}
          message={dataSufficiency.message}
        />
      </>
    );
  }
  
  console.log('Rendering full predictive inventory page - sufficient data available');
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent flex items-center">
            <Brain className="h-6 w-6 mr-2 text-neutral-400" />
            AI-Powered Inventory Forecasting
            <Badge className="ml-3 bg-gradient-to-r from-neutral-700 to-neutral-800 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Engine
            </Badge>
          </h1>
          <p className="text-neutral-400 text-sm">
            Machine learning predictions based on historical distribution patterns and demand trends
          </p>
        </div>
        <Button onClick={handleRefreshPredictions} className="gap-2 bg-gray-800 hover:bg-gray-900">
          <RefreshCw className="h-4 w-4" />
          Refresh AI Analysis
        </Button>
      </div>
      
      {/* AI-Enhanced Summary cards */}
      <SummaryCards 
        criticalCount={criticalCount} 
        warningCount={warningCount} 
        normalCount={normalCount} 
      />
      
      {/* Main content */}
      <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-neutral-800">
          <CardTitle className="text-lg flex items-center text-white">
            <BarChart className="h-5 w-5 mr-2 text-neutral-400" />
            AI Supply Chain Intelligence
            <Badge variant="outline" className="ml-2 bg-neutral-700/20 text-neutral-300 border-neutral-600/30">
              Machine Learning
            </Badge>
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Advanced analytics powered by AI algorithms analyzing {transactions.length}+ historical transactions
          </CardDescription>
        </CardHeader>
        
        {/* Filters and search */}
        <SearchFilters
          searchTerm={searchTerm}
          timeFilter={timeFilter}
          monthFilter={monthFilter}
          weekFilter={weekFilter}
          sortBy={sortBy}
          setSearchTerm={setSearchTerm}
          setTimeFilter={setTimeFilter}
          setMonthFilter={setMonthFilter}
          setWeekFilter={setWeekFilter}
          setSortBy={setSortBy}
        />
        
        <Tabs defaultValue="table" className="w-full">
          <div className="px-4 pt-4 border-b border-neutral-800">
            <TabsList className="bg-neutral-800/50">
              <TabsTrigger value="table">AI Analysis Table</TabsTrigger>
              <TabsTrigger value="cards">Smart Cards View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="table" className="m-0">
            <PredictionTable 
              predictions={sortedPredictions} 
              getUrgencyBadge={getUrgencyBadge}
              isLowStockContext={isLowStockContext}
            />
          </TabsContent>
          
          <TabsContent value="cards" className="m-0">
            <PredictionCards 
              predictions={sortedPredictions} 
              getUrgencyBadge={getUrgencyBadge}
              isLowStockContext={isLowStockContext}
            />
          </TabsContent>
        </Tabs>
        
        <CardFooter className="p-4 bg-neutral-900/70 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-neutral-400 flex items-center">
            <Brain className="h-4 w-4 mr-2 text-neutral-400" />
            AI analyzing {sortedPredictions.length} of {predictions.length} products
          </div>
          <div className="text-sm text-neutral-400 flex items-center">
            <Info className="h-4 w-4 mr-2 text-neutral-400" />
            Machine learning model trained on {transactions.length} shipment records
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PredictiveInventory;
