
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Filter,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface InvoiceOverviewProps {
  connectedPlatforms: string[];
  isLoading?: boolean;
}

// Sample invoice data - would be imported from connected accounting platforms
const sampleInvoices = [
  {
    id: 'INV-2024-001',
    customerName: 'Acme Corporation',
    amount: 12500.00,
    status: 'paid',
    dueDate: '2024-01-15',
    issueDate: '2023-12-15',
    platform: 'quickbooks'
  },
  {
    id: 'INV-2024-002', 
    customerName: 'Tech Solutions Ltd',
    amount: 8750.00,
    status: 'pending',
    dueDate: '2024-02-01',
    issueDate: '2024-01-01',
    platform: 'quickbooks'
  },
  {
    id: 'INV-2024-003',
    customerName: 'Global Industries',
    amount: 15200.00,
    status: 'overdue',
    dueDate: '2024-01-30',
    issueDate: '2023-12-30',
    platform: 'xero'
  },
  {
    id: 'INV-2024-004',
    customerName: 'StartupCo',
    amount: 3400.00,
    status: 'draft',
    dueDate: '2024-02-15',
    issueDate: '2024-01-15',
    platform: 'wave'
  },
  {
    id: 'INV-2024-005',
    customerName: 'Enterprise LLC',
    amount: 22100.00,
    status: 'paid',
    dueDate: '2024-01-20',
    issueDate: '2023-12-20',
    platform: 'quickbooks'
  }
];

export const InvoiceOverview: React.FC<InvoiceOverviewProps> = ({
  connectedPlatforms,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const hasConnectedPlatforms = connectedPlatforms.length > 0;

  const filteredInvoices = sampleInvoices.filter(invoice => {
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-slate-600 text-slate-400"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      quickbooks: 'bg-green-600',
      xero: 'bg-sky-600', 
      wave: 'bg-blue-600',
      sage: 'bg-teal-600',
      freshbooks: 'bg-orange-600'
    };
    
    return (
      <Badge variant="secondary" className={`${colors[platform] || 'bg-slate-600'} text-white text-xs`}>
        {platform}
      </Badge>
    );
  };

  // Calculate summary statistics
  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  if (!hasConnectedPlatforms) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Invoice Data Available</h3>
          <p className="text-slate-400 text-center max-w-md mb-6">
            Connect your accounting platform to import and view your invoices.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50 animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalInvoices}</div>
            <div className="text-sm text-slate-400">All time</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-slate-400">Outstanding + Paid</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">  
            <CardTitle className="text-sm text-slate-300">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(paidAmount)}</div>
            <div className="text-sm text-slate-400">Collected</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(pendingAmount + overdueAmount)}</div>
            <div className="text-sm text-slate-400">Pending + Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-400" />
                Invoice Overview
              </CardTitle>
              <CardDescription className="text-slate-400">
                Imported invoices from connected accounting platforms
              </CardDescription>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white w-64"
                />
              </div>
              
              <Button variant="secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-800/90">
              <TableRow className="border-slate-700">
                <TableHead className="font-medium text-slate-300">Invoice #</TableHead>
                <TableHead className="font-medium text-slate-300">Customer</TableHead>
                <TableHead className="font-medium text-slate-300">Amount</TableHead>
                <TableHead className="font-medium text-slate-300">Status</TableHead>
                <TableHead className="font-medium text-slate-300">Due Date</TableHead>
                <TableHead className="font-medium text-slate-300">Platform</TableHead>
                <TableHead className="font-medium text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-slate-700 hover:bg-slate-700/20">
                  <TableCell className="font-medium text-white">{invoice.id}</TableCell>
                  <TableCell className="text-slate-300">{invoice.customerName}</TableCell>
                  <TableCell className="text-white font-medium">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-slate-300">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{getPlatformBadge(invoice.platform)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
