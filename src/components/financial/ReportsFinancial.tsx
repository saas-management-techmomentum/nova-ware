import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Plus
} from "lucide-react";
import { useFinancialReports } from "@/hooks/useFinancialReports";
import { CreateReportDialog } from "./CreateReportDialog";
import { format } from "date-fns";

// Report type configurations
const REPORT_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'profit-loss': { icon: TrendingUp, color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', label: 'Profit & Loss' },
  'balance-sheet': { icon: DollarSign, color: 'bg-green-500/20 text-green-400 border-green-500/20', label: 'Balance Sheet' },
  'cash-flow': { icon: BarChart3, color: 'bg-purple-500/20 text-purple-400 border-purple-500/20', label: 'Cash Flow' },
  'ar-aging': { icon: PieChart, color: 'bg-orange-500/20 text-orange-400 border-orange-500/20', label: 'AR Aging' },
};

export const ReportsFinancial = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { reports, isLoading, createReport, downloadReport } = useFinancialReports();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      completed: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completed' },
      draft: { className: 'bg-gray-700/20 text-gray-400 border-gray-600/30', label: 'Draft' },
      generating: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Generating...' },
      failed: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' },
    };
    const config = variants[status] || variants.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Financial Reports</h2>
          <p className="text-neutral-400 mt-1">Generate and manage financial reports</p>
        </div>
        <Button 
          className="bg-white text-black hover:bg-neutral-200"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Custom Report
        </Button>
      </div>

      {/* Report Types */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Available Report Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(REPORT_TYPE_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            const typeReports = reports.filter(r => r.report_type === type);
            const lastGenerated = typeReports.length > 0 
              ? typeReports[0].last_generated_at 
              : undefined;

            return (
              <Card key={type} className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-1 text-white">{config.label}</h4>
                  <p className="text-sm text-neutral-400 mb-3">
                    {typeReports.length} report{typeReports.length !== 1 ? 's' : ''} generated
                  </p>
                  <div className="flex items-center text-xs text-neutral-500 mb-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    Last: {formatDate(lastGenerated)}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-white text-black hover:bg-neutral-200"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Recent Reports</h3>
        <Card className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-neutral-400">
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                No reports generated yet. Create your first custom report above.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {reports.slice(0, 10).map((report) => {
                  const config = REPORT_TYPE_CONFIG[report.report_type] || REPORT_TYPE_CONFIG['profit-loss'];
                  return (
                    <div key={report.id} className="p-4 hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{report.report_name}</h4>
                            <div className="flex items-center gap-3 text-sm text-neutral-400">
                              <span>{config.label}</span>
                              <span>•</span>
                              <span>{formatDate(report.created_at)}</span>
                              {report.file_size && (
                                <>
                                  <span>•</span>
                                  <span>{report.file_size}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <Badge variant="outline" className="bg-neutral-900 border-neutral-700 text-neutral-300">{report.file_format}</Badge>
                          {report.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadReport(report)}
                              className="hover:bg-neutral-800"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateReportDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateReport={createReport}
      />
    </div>
  );
};
