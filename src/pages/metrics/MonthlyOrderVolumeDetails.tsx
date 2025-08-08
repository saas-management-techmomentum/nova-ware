
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Sample order volume data for charts (same as Dashboard)
const monthlyOrderVolume = [
  { name: 'Jan', processed: 150, backlog: 12 },
  { name: 'Feb', processed: 170, backlog: 10 },
  { name: 'Mar', processed: 190, backlog: 15 },
  { name: 'Apr', processed: 210, backlog: 8 },
  { name: 'May', processed: 240, backlog: 9 },
  { name: 'Jun', processed: 220, backlog: 5 },
  { name: 'Jul', processed: 205, backlog: 7 },
  { name: 'Aug', processed: 230, backlog: 9 },
  { name: 'Sep', processed: 245, backlog: 11 },
  { name: 'Oct', processed: 260, backlog: 8 },
  { name: 'Nov', processed: 270, backlog: 6 },
  { name: 'Dec', processed: 290, backlog: 4 },
];

const chartConfig = {
  processed: {
    label: 'Processed Orders',
    theme: {
      light: '#6366f1',
      dark: '#6366f1',
    },
  },
  backlog: {
    label: 'Backlog Orders',
    theme: {
      light: '#f43f5e',
      dark: '#f43f5e',
    },
  },
};

const MonthlyOrderVolumeDetails = () => {
  const navigate = useNavigate();

  // Calculate total orders processed and average backlog
  const totalProcessed = monthlyOrderVolume.reduce((sum, month) => sum + month.processed, 0);
  const avgBacklog = Math.round(monthlyOrderVolume.reduce((sum, month) => sum + month.backlog, 0) / monthlyOrderVolume.length);
  const totalOrders = totalProcessed + monthlyOrderVolume.reduce((sum, month) => sum + month.backlog, 0);

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
            Monthly Order Volume
          </h1>
        </div>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
        <CardHeader className="pb-2 relative z-10 border-b border-slate-700">
          <CardTitle className="text-lg flex items-center text-white">
            <BarChart className="h-5 w-5 mr-2 text-indigo-400" />
            Order Volume (Past 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[500px]">
            <ChartContainer config={chartConfig} className="h-full">
              <RechartsBarChart
                data={monthlyOrderVolume}
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
                <Bar dataKey="processed" name="processed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="backlog" name="backlog" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </RechartsBarChart>
            </ChartContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-slate-800/70 border-slate-700/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-indigo-400 font-semibold">Total Orders Processed</h3>
                  <span className="text-xs px-2 py-0.5 bg-indigo-500/30 rounded-full border border-indigo-500/50 text-indigo-200">
                    +16.3% YoY
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{totalProcessed}</div>
                <p className="text-sm text-slate-400">
                  Over the past 12 months
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/70 border-slate-700/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-rose-400 font-semibold">Average Backlog</h3>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/30 rounded-full border border-emerald-500/50 text-emerald-200">
                    -3.2% YoY
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{avgBacklog}</div>
                <p className="text-sm text-slate-400">
                  Monthly average
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/70 border-slate-700/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sky-400 font-semibold">Fulfillment Rate</h3>
                  <span className="text-xs px-2 py-0.5 bg-sky-500/30 rounded-full border border-sky-500/50 text-sky-200">
                    +2.1% YoY
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {Math.round((totalProcessed / totalOrders) * 100)}%
                </div>
                <p className="text-sm text-slate-400">
                  Orders processed vs. total
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyOrderVolumeDetails;
