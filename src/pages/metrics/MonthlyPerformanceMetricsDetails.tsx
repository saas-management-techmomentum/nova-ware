
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Sample performance data for charts (same as Dashboard)
const monthlyPerformanceData = [
  { name: 'Jan', efficiency: 82, orders: 32, tasks: 78 },
  { name: 'Feb', efficiency: 87, orders: 35, tasks: 81 },
  { name: 'Mar', efficiency: 84, orders: 40, tasks: 85 },
  { name: 'Apr', efficiency: 91, orders: 38, tasks: 88 },
  { name: 'May', efficiency: 94, orders: 45, tasks: 90 },
  { name: 'Jun', efficiency: 88, orders: 42, tasks: 84 },
  { name: 'Jul', efficiency: 86, orders: 39, tasks: 83 },
  { name: 'Aug', efficiency: 92, orders: 44, tasks: 87 },
  { name: 'Sep', efficiency: 89, orders: 41, tasks: 86 },
  { name: 'Oct', efficiency: 93, orders: 47, tasks: 89 },
  { name: 'Nov', efficiency: 90, orders: 43, tasks: 85 },
  { name: 'Dec', efficiency: 95, orders: 48, tasks: 91 },
];

const chartConfig = {
  efficiency: {
    label: 'Warehouse Efficiency',
    theme: {
      light: '#6366f1',
      dark: '#6366f1',
    },
  },
  tasks: {
    label: 'Task Completion',
    theme: {
      light: '#10b981',
      dark: '#10b981',
    },
  },
  orders: {
    label: 'Order Speed',
    theme: {
      light: '#0ea5e9',
      dark: '#0ea5e9',
    },
  },
};

const MonthlyPerformanceMetricsDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 border-slate-700 bg-slate-800/50 hover:bg-slate-700/70"
            onClick={() => navigate('/app')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Monthly Performance Metrics
          </h1>
        </div>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
        <CardHeader className="pb-2 relative z-10 border-b border-slate-700">
          <CardTitle className="text-lg flex items-center text-white">
            <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
            Performance Metrics (Past 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[500px]">
            <ChartContainer config={chartConfig} className="h-full">
              <AreaChart
                data={monthlyPerformanceData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="efficiency" name="efficiency" stroke="#6366f1" fill="url(#colorEfficiency)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="tasks" name="tasks" stroke="#10b981" fill="url(#colorTasks)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="orders" name="orders" stroke="#0ea5e9" fill="url(#colorOrders)" fillOpacity={0.2} />
                <defs>
                  <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ChartContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-slate-800/70 border-slate-700/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-indigo-400 font-semibold">Warehouse Efficiency</h3>
                  <span className="text-xs px-2 py-0.5 bg-indigo-500/30 rounded-full border border-indigo-500/50 text-indigo-200">
                    +4.2% YoY
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">91.2%</div>
                <p className="text-sm text-slate-400">
                  Average over the past 12 months
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/70 border-slate-700/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-emerald-400 font-semibold">Task Completion</h3>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/30 rounded-full border border-emerald-500/50 text-emerald-200">
                    +2.5% YoY
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">86.4%</div>
                <p className="text-sm text-slate-400">
                  Average over the past 12 months
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/70 border-slate-700/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sky-400 font-semibold">Order Processing</h3>
                  <span className="text-xs px-2 py-0.5 bg-sky-500/30 rounded-full border border-sky-500/50 text-sky-200">
                    +5.7% YoY
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">89.8%</div>
                <p className="text-sm text-slate-400">
                  Average over the past 12 months
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyPerformanceMetricsDetails;
