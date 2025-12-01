import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  'profit-loss': { icon: TrendingUp, color: 'bg-blue-500', label: 'Profit & Loss' },
  'balance-sheet': { icon: DollarSign, color: 'bg-green-500', label: 'Balance Sheet' },
  'cash-flow': { icon: BarChart3, color: 'bg-purple-500', label: 'Cash Flow' },
  'ar-aging': { icon: PieChart, color: 'bg-orange-500', label: 'AR Aging' },
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
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: 'default', label: 'Completed' },
      draft: { variant: 'secondary', label: 'Draft' },
      generating: { variant: 'outline', label: 'Generating...' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Financial Reports</h2>
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
        <h3 className="text-lg font-medium mb-4">Available Report Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(REPORT_TYPE_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            const typeReports = reports.filter(r => r.report_type === type);
            const lastGenerated = typeReports.length > 0 
              ? typeReports[0].last_generated_at 
              : undefined;

            return (
              <Card key={type} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-1">{config.label}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {typeReports.length} report{typeReports.length !== 1 ? 's' : ''} generated
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    Last: {formatDate(lastGenerated)}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
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
        <h3 className="text-lg font-medium mb-4">Recent Reports</h3>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No reports generated yet. Create your first custom report above.
              </div>
            ) : (
              <div className="divide-y">
                {reports.slice(0, 10).map((report) => {
                  const config = REPORT_TYPE_CONFIG[report.report_type] || REPORT_TYPE_CONFIG['profit-loss'];
                  return (
                    <div key={report.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{report.report_name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                          <Badge variant="outline">{report.file_format}</Badge>
                          {report.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadReport(report)}
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
