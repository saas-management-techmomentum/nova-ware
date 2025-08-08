
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer, TrendingUp, ArrowLeft, Truck, PackageCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useWorkflowMetrics } from '@/hooks/useWorkflowMetrics';
import WarehouseContextIndicator from '@/components/warehouse/WarehouseContextIndicator';

const OrderProcessingDetails = () => {
  const { selectedWarehouse, isUserAdmin } = useWarehouse();
  const { data: workflowMetrics, isLoading: metricsLoading } = useWorkflowMetrics();

  // Show loading state when data is being fetched
  if (metricsLoading) {
    return (
      <div className="space-y-6 animate-fade-in text-white">
        <div className="flex items-center gap-4 mb-2">
          <Button asChild variant="outline" size="icon" className="h-8 w-8 border-slate-700 bg-slate-800/50">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Real-Time Order Processing Speed
          </h1>
        </div>

        <WarehouseContextIndicator />

        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
              <span className="ml-3 text-slate-400">Loading workflow processing data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workflowMetrics) {
    return (
      <div className="space-y-6 animate-fade-in text-white">
        <div className="flex items-center gap-4 mb-2">
          <Button asChild variant="outline" size="icon" className="h-8 w-8 border-slate-700 bg-slate-800/50">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Real-Time Order Processing Speed
          </h1>
        </div>

        <WarehouseContextIndicator />

        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-slate-400">No workflow data available. Start some workflows to see processing metrics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div className="flex items-center gap-4 mb-2">
        <Button asChild variant="outline" size="icon" className="h-8 w-8 border-slate-700 bg-slate-800/50">
          <Link to="/app">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Real-Time Order Processing Speed
        </h1>
      </div>

      <WarehouseContextIndicator />

      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
        <CardHeader className="pb-2 relative z-10 border-b border-slate-700">
          <CardTitle className="text-xl flex items-center text-white gap-2">
            <Timer className="h-6 w-6 text-sky-400" />
            Order Processing Speed: {workflowMetrics.processingSpeed}%
            <span className="ml-auto text-sm flex items-center gap-1 text-emerald-400 font-normal">
              <TrendingUp className="h-4 w-4" />
              Live Workflow Data
            </span>
          </CardTitle>
          <div className="text-xs text-slate-400 mt-1">
            Based on {workflowMetrics.totalWorkflows} total workflows, {workflowMetrics.completedWorkflows} completed
            {!selectedWarehouse && isUserAdmin && (
              <span className="ml-2 text-blue-400">• Corporate Overview (All Warehouses)</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Progress 
            value={workflowMetrics.processingSpeed} 
            className="h-2.5 mb-8 bg-slate-700"
            indicatorClassName="bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Live Processing Metrics</h3>
              <p className="text-slate-300">
                Order Processing Speed is calculated using real timestamp analysis across {workflowMetrics.totalWorkflows} workflows.
                The score combines completion rate ({Math.round(workflowMetrics.completedWorkflows / Math.max(workflowMetrics.totalWorkflows, 1) * 100)}%), 
                time efficiency ({workflowMetrics.timeEfficiency}%), and {workflowMetrics.strategyMetrics.currentStrategy} strategy performance ({workflowMetrics.strategyPerformance}%).
              </p>
              
              <h3 className="text-lg font-medium text-slate-200 mt-6">Enhanced Calculation Method</h3>
              <p className="text-slate-300">
                Processing speed uses a weighted formula: 40% completion rate + 30% time efficiency + 30% strategy performance.
                Time efficiency compares actual step durations against target benchmarks using real started_at/completed_at timestamps.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1">Current Strategy</div>
                  <div className="text-lg font-semibold text-sky-400">{workflowMetrics.strategyMetrics.currentStrategy}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1">Recommended</div>
                  <div className="text-lg font-semibold text-emerald-400">{workflowMetrics.strategyMetrics.recommendedStrategy}</div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-400" />
                    Average Processing Time
                  </h4>
                  <span className="text-xl font-semibold text-sky-400">{workflowMetrics.averageProcessingTime} min</span>
                </div>
                <p className="text-sm text-slate-400">
                  Average time from workflow start to completion based on actual completed workflows.
                </p>
              </div>
              
              <h3 className="text-lg font-medium text-slate-200 mt-6">Current Processing Pipeline</h3>
              <div className="space-y-3">
                {workflowMetrics.stepMetrics.map((step, index) => (
                  <Card key={index} className="bg-slate-800/70 border-slate-700/50">
                    <CardContent className="p-4">
                       <div className="flex justify-between items-center mb-1">
                         <h4 className="font-medium text-white">{step.stepName}</h4>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400">{step.currentCount} active</span>
                           <span className="text-sky-400 font-medium">{step.averageTime}/{step.targetTime} min</span>
                         </div>
                       </div>
                       <p className="text-xs text-slate-400 mb-2">
                         {step.completedCount} completed steps • Target: {step.targetTime} min
                         {step.bottleneckScore > 20 && (
                           <span className="ml-2 text-red-400">• Bottleneck detected</span>
                         )}
                       </p>
                       <div className="flex items-center gap-2 mb-2">
                         <Progress
                           value={step.efficiency}
                           className="h-1.5 bg-slate-700"
                           indicatorClassName={step.efficiency >= 80 ? "bg-emerald-500/80" : step.efficiency >= 60 ? "bg-yellow-500/80" : "bg-red-500/80"}
                         />
                         <span className="text-xs text-slate-300 w-16 shrink-0">{step.efficiency}% efficient</span>
                       </div>
                       {step.bottleneckScore > 0 && (
                         <div className="flex items-center justify-between text-xs">
                           <span className="text-slate-400">Bottleneck Score:</span>
                           <span className={`font-medium ${
                             step.bottleneckScore > 30 ? 'text-red-400' : 
                             step.bottleneckScore > 15 ? 'text-yellow-400' : 
                             'text-emerald-400'
                           }`}>
                             {step.bottleneckScore}
                           </span>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Processing Speed Trend</h3>
              <div className="h-80 bg-slate-800/70 rounded-lg border border-slate-700 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={workflowMetrics.historicalTrend}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Area 
                      type="monotone" 
                      dataKey="speed" 
                      name="Processing Speed %" 
                      stroke="#0ea5e9" 
                      fill="url(#colorActual)" 
                      fillOpacity={0.3} 
                      activeDot={{ r: 8, fill: '#0ea5e9' }} 
                    />
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <h3 className="text-lg font-medium text-slate-200 mt-6">Current Workflow Status</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-sky-400" />
                    Workflows Completed
                  </h4>
                  <p className="text-sm text-slate-400">{workflowMetrics.completedWorkflows} workflows have been successfully completed</p>
                </div>
                <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sky-400" />
                    Workflows In Progress
                  </h4>
                  <p className="text-sm text-slate-400">{workflowMetrics.inProgressWorkflows} workflows currently being processed</p>
                </div>
                <div className="p-4 bg-slate-800/70 rounded-lg border border-slate-700/50">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Timer className="h-4 w-4 text-sky-400" />
                    Real-time Updates
                  </h4>
                  <p className="text-sm text-slate-400">Processing speed updates automatically from actual workflow timestamps</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderProcessingDetails;
