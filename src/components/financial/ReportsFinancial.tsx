
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  FileBarChart,
  Plus
} from 'lucide-react';

export const ReportsFinancial: React.FC = () => {
  // Mock data - will be replaced with real data hooks
  const reportTypes = [
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      description: 'Income and expenses over a specific period',
      icon: TrendingUp,
      lastGenerated: '2025-01-15',
      frequency: 'Monthly'
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity snapshot',
      icon: BarChart3,
      lastGenerated: '2025-01-10',
      frequency: 'Monthly'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Cash receipts and payments analysis',
      icon: PieChart,
      lastGenerated: '2025-01-12',
      frequency: 'Weekly'
    },
    {
      id: 'ar-aging',
      name: 'Accounts Receivable Aging',
      description: 'Outstanding customer payments by age',
      icon: FileBarChart,
      lastGenerated: '2025-01-16',
      frequency: 'Weekly'
    }
  ];

  const recentReports = [
    {
      id: '1',
      name: 'Monthly P&L - December 2024',
      type: 'Profit & Loss',
      generatedDate: '2025-01-05',
      size: '2.3 MB',
      format: 'PDF'
    },
    {
      id: '2',
      name: 'Balance Sheet - Q4 2024',
      type: 'Balance Sheet',
      generatedDate: '2025-01-03',
      size: '1.8 MB',
      format: 'PDF'
    },
    {
      id: '3',
      name: 'Cash Flow Analysis - December',
      type: 'Cash Flow',
      generatedDate: '2025-01-02',
      size: '3.1 MB',
      format: 'Excel'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFormatBadge = (format: string) => {
    const color = format === 'PDF' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30';
    return <Badge className={color}>{format}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Financial Reports</h2>
          <p className="text-slate-400 mt-1">Generate and manage financial statements and reports</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Custom Report
        </Button>
      </div>

      {/* Report Types Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.id} className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/20">
                    <IconComponent className="h-5 w-5 text-blue-400" />
                  </div>
                  <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30">
                    {report.frequency}
                  </Badge>
                </div>
                <h3 className="text-white font-semibold mb-2">{report.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{report.description}</p>
                <div className="text-xs text-slate-500 mb-4">
                  Last generated: {formatDate(report.lastGenerated)}
                </div>
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports Table */}
      <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Recent Reports
          </CardTitle>
          <CardDescription className="text-slate-400">
            Recently generated financial reports and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-700/50 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{report.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-400 text-sm">{report.type}</span>
                      <span className="text-slate-500 text-sm">•</span>
                      <span className="text-slate-400 text-sm">{formatDate(report.generatedDate)}</span>
                      <span className="text-slate-500 text-sm">•</span>
                      <span className="text-slate-400 text-sm">{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getFormatBadge(report.format)}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">Monthly Close</CardTitle>
            <CardDescription className="text-slate-400">
              Generate all monthly financial reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Run Month-End Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">Tax Reports</CardTitle>
            <CardDescription className="text-slate-400">
              Generate tax-related financial documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <FileBarChart className="h-4 w-4 mr-2" />
              Tax Report Package
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">Export All</CardTitle>
            <CardDescription className="text-slate-400">
              Export all financial data for backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Full Data Export
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
