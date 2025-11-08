import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  FileText, 
  Link as LinkIcon, 
  RefreshCw, 
  Upload, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Check,
  AlertCircle
} from 'lucide-react';
import integrationService from '@/services/integrationService';
import quickBooksAdapter, { QuickBooksConfig } from '@/services/quickBooksAdapter';

// Sample P&L data
const sampleData = {
  revenue: [
    { category: 'Warehouse Storage Fees', amount: 45280 },
    { category: 'Handling Fees', amount: 28650 },
    { category: 'Shipping Services', amount: 36420 },
    { category: 'Value-Added Services', amount: 12750 }
  ],
  expenses: [
    { category: 'Salaries and Wages', amount: 34200 },
    { category: 'Rent and Facilities', amount: 18500 },
    { category: 'Utilities', amount: 4850 },
    { category: 'Equipment Maintenance', amount: 3640 },
    { category: 'Software Subscriptions', amount: 2250 },
    { category: 'Insurance', amount: 3800 },
    { category: 'Office Supplies', amount: 1250 }
  ]
};

// Accounting platform configurations (existing platforms plus QuickBooks)
const accountingPlatforms = [
  { 
    id: 'quickbooks', 
    name: 'QuickBooks Online', 
    logo: 'Q',
    color: 'from-green-600 to-emerald-600',
    hoverColor: 'from-green-500 to-emerald-500',
    placeholderUrl: 'https://quickbooks.api.intuit.com/v3/company/your-company-id',
    helpText: 'Enter your QuickBooks API endpoint URL to sync your financial data.',
    hasAdvancedConfig: true
  },
  { 
    id: 'wave', 
    name: 'Wave Accounting', 
    logo: 'W',
    color: 'from-gray-700 to-gray-600',
    hoverColor: 'from-gray-600 to-gray-500',
    placeholderUrl: 'https://api.waveapps.com/webhook/your-webhook-id',
    helpText: 'Enter the webhook URL from your Wave account to connect your financial data.'
  },
  { 
    id: 'xero', 
    name: 'Xero', 
    logo: 'X',
    color: 'from-sky-600 to-cyan-600',
    hoverColor: 'from-sky-500 to-cyan-500',
    placeholderUrl: 'https://api.xero.com/api.xro/2.0/your-organization-id',
    helpText: 'Enter your Xero API connection URL to import your financial data.'
  },
  { 
    id: 'sage', 
    name: 'Sage', 
    logo: 'S',
    color: 'from-teal-600 to-emerald-600',
    hoverColor: 'from-teal-500 to-emerald-500',
    placeholderUrl: 'https://api.accounting.sage.com/v3.1/your-business-id',
    helpText: 'Enter your Sage API endpoint to connect your accounting data.'
  },
  { 
    id: 'freshbooks', 
    name: 'FreshBooks', 
    logo: 'F',
    color: 'from-orange-600 to-amber-600',
    hoverColor: 'from-orange-500 to-amber-500',
    placeholderUrl: 'https://api.freshbooks.com/auth/oauth/your-token',
    helpText: 'Enter your FreshBooks API token URL to sync your accounting data.'
  }
];

const Reports = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plData, setPlData] = useState(sampleData);
  const [selectedPlatform, setSelectedPlatform] = useState(accountingPlatforms[0].id);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // QuickBooks configuration state
  const [quickBooksConfig, setQuickBooksConfig] = useState<QuickBooksConfig>({
    companyId: '',
    accessToken: '',
    refreshToken: '',
    environment: 'sandbox',
  });

  // Get current platform data
  const currentPlatform = accountingPlatforms.find(p => p.id === selectedPlatform) || accountingPlatforms[0];

  // Calculate totals
  const totalRevenue = plData.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = plData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  // Check if financial data should be hidden
  const shouldHideFinancialData = connectedPlatforms.length === 0;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentPlatform.id === 'quickbooks') {
      return handleQuickBooksConnect();
    }
    
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: `Please enter your ${currentPlatform.name} connection URL`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Configure the integration service
      integrationService.configureService('supabase', {
        endpoint: webhookUrl,
        apiKey: 'sample-key', // This would be properly secured in a real implementation
      });
      
      // In a real implementation, this would make an API call to the selected platform
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      setIsConnected(true);
      setConnectedPlatforms(prev => [...prev.filter(p => p !== currentPlatform.id), currentPlatform.id]);
      
      toast({
        title: `Connected to ${currentPlatform.name}`,
        description: "Your P&L data will be synced automatically.",
      });
    } catch (error) {
      console.error(`Error connecting to ${currentPlatform.name}:`, error);
      toast({
        title: "Connection Error",
        description: `Failed to connect to ${currentPlatform.name}. Please check the URL and try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBooksConnect = async () => {
    if (!quickBooksConfig.companyId || !quickBooksConfig.accessToken) {
      toast({
        title: "Error",
        description: "Please fill in Company ID and Access Token for QuickBooks",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      quickBooksAdapter.configure(quickBooksConfig);
      await quickBooksAdapter.initialize();
      
      setIsConnected(true);
      setConnectedPlatforms(prev => [...prev.filter(p => p !== 'quickbooks'), 'quickbooks']);
      
      toast({
        title: "Connected to QuickBooks",
        description: "Your QuickBooks integration is now active.",
      });
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to QuickBooks. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate fetching updated data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Data Refreshed",
        description: `Your P&L data has been updated from ${currentPlatform.name}.`,
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: `Unable to refresh data from ${currentPlatform.name}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnectedPlatforms(prev => prev.filter(p => p !== currentPlatform.id));
    if (selectedPlatform === currentPlatform.id) {
      setIsConnected(false);
      setWebhookUrl('');
      if (currentPlatform.id === 'quickbooks') {
        setQuickBooksConfig({
          companyId: '',
          accessToken: '',
          refreshToken: '',
          environment: 'sandbox',
        });
      }
    }
    
    toast({
      title: "Disconnected",
      description: `Your ${currentPlatform.name} account has been disconnected.`,
    });
  };

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatform(platformId);
    setIsConnected(connectedPlatforms.includes(platformId));
    setWebhookUrl(''); // Reset webhook URL when changing platforms
    setShowAdvancedConfig(false);
    
    // Reset QuickBooks config when switching away
    if (platformId !== 'quickbooks') {
      setQuickBooksConfig({
        companyId: '',
        accessToken: '',
        refreshToken: '',
        environment: 'sandbox',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-gray-400" />
          Financial Reports
        </h1>
        
        {isConnected && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshData}
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        )}
      </div>

      <Tabs defaultValue="profit-loss" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/70 border border-slate-700/50">
          <TabsTrigger 
            value="profit-loss" 
            className="flex items-center data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger 
            value="integrations" 
            className="flex items-center data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Platform Connections
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profit-loss" className="space-y-6 mt-6">
          {shouldHideFinancialData ? (
            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Accounting Platform Connected</h3>
                <p className="text-slate-400 text-center max-w-md mb-6">
                  Please connect an accounting platform to view your financial data. 
                  Go to the "Platform Connections" tab to get started.
                </p>
                <Button 
                  onClick={() => setActiveTab('integrations')}
                  className="bg-gray-800 hover:bg-gray-900"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Platform Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-2 border-b border-slate-700/50">
                    <CardTitle className="text-lg text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-gray-400" />
                      Total Revenue
                    </CardTitle>
                    <CardDescription className="text-slate-400">Current period</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-2 border-b border-slate-700/50">
                    <CardTitle className="text-lg text-white flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2 text-rose-400" />
                      Total Expenses
                    </CardTitle>
                    <CardDescription className="text-slate-400">Current period</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-2 border-b border-slate-700/50">
                    <CardTitle className="text-lg text-white flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-emerald-400" />
                      Net Profit
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Profit margin: 
                      <span className={Number(profitMargin) > 0 ? 'text-emerald-400 ml-1' : 'text-rose-400 ml-1'}>
                        {profitMargin}%
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(netProfit)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-700/50">
                    <CardTitle className="text-lg flex items-center text-white">
                      <FileText className="h-5 w-5 mr-2 text-gray-400" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-800/90">
                        <TableRow className="border-slate-700">
                          <TableHead className="font-medium text-slate-300">Category</TableHead>
                          <TableHead className="text-right font-medium text-slate-300">Amount</TableHead>
                          <TableHead className="text-right font-medium text-slate-300">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plData.revenue.map((item, index) => (
                          <TableRow key={index} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                            <TableCell className="text-slate-300">{item.category}</TableCell>
                            <TableCell className="text-right text-gray-300">{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-right text-slate-400">
                              {((item.amount / totalRevenue) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium bg-slate-700/30 border-slate-700">
                          <TableCell className="text-white">Total Revenue</TableCell>
                          <TableCell className="text-right text-gray-300">{formatCurrency(totalRevenue)}</TableCell>
                          <TableCell className="text-right text-slate-300">100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-700/50">
                    <CardTitle className="text-lg flex items-center text-white">
                      <FileText className="h-5 w-5 mr-2 text-rose-400" />
                      Expense Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-800/90">
                        <TableRow className="border-slate-700">
                          <TableHead className="font-medium text-slate-300">Category</TableHead>
                          <TableHead className="text-right font-medium text-slate-300">Amount</TableHead>
                          <TableHead className="text-right font-medium text-slate-300">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plData.expenses.map((item, index) => (
                          <TableRow key={index} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                            <TableCell className="text-slate-300">{item.category}</TableCell>
                            <TableCell className="text-right text-rose-300">{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-right text-slate-400">
                              {((item.amount / totalExpenses) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium bg-slate-700/30 border-slate-700">
                          <TableCell className="text-white">Total Expenses</TableCell>
                          <TableCell className="text-right text-rose-300">{formatCurrency(totalExpenses)}</TableCell>
                          <TableCell className="text-right text-slate-300">100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-700/50">
                  <CardTitle className="text-lg flex items-center text-white">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
                    Profit & Loss Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-800/90">
                      <TableRow className="border-slate-700">
                        <TableHead className="font-medium text-slate-300">Category</TableHead>
                        <TableHead className="text-right font-medium text-slate-300">Amount</TableHead>
                        <TableHead className="text-right font-medium text-slate-300">% of Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                        <TableCell className="font-medium text-gray-300">Total Revenue</TableCell>
                        <TableCell className="text-right text-gray-300">{formatCurrency(totalRevenue)}</TableCell>
                        <TableCell className="text-right text-slate-300">100%</TableCell>
                      </TableRow>
                      <TableRow className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                        <TableCell className="font-medium text-rose-300">Total Expenses</TableCell>
                        <TableCell className="text-right text-rose-300">
                          ({formatCurrency(totalExpenses)})
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          {((totalExpenses / totalRevenue) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-slate-700/30 border-slate-700">
                        <TableCell className="text-white">Net Profit</TableCell>
                        <TableCell className={`text-right ${netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {formatCurrency(netProfit)}
                        </TableCell>
                        <TableCell className={`text-right ${Number(profitMargin) > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {profitMargin}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-lg text-white">Connect to Accounting Platforms</CardTitle>
              <CardDescription className="text-slate-400">
                Link your accounting platform to automatically sync your P&L data
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="platform-select" className="text-white">Select Accounting Platform</Label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {accountingPlatforms.map((platform) => (
                      <Button 
                        key={platform.id}
                        variant="outline"
                        className={`relative h-20 flex flex-col items-center justify-center p-2 border-slate-700 
                          ${selectedPlatform === platform.id ? 'bg-slate-700/70 border-slate-500 ring-1 ring-slate-400' : 'bg-slate-800/30 hover:bg-slate-700/30'}
                          ${connectedPlatforms.includes(platform.id) ? 'border-green-500/30' : ''}
                        `}
                        onClick={() => handlePlatformChange(platform.id)}
                      >
                        <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-semibold`}>
                          {platform.logo}
                        </div>
                        <span className="mt-2 text-xs text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                          {platform.name}
                        </span>
                        {connectedPlatforms.includes(platform.id) && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-600 rounded-full flex items-center justify-center border border-emerald-400">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {!isConnected ? (
                  <form onSubmit={handleConnect} className="space-y-4">
                    {currentPlatform.id === 'quickbooks' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="qb-company" className="text-white">Company ID</Label>
                            <Input
                              id="qb-company"
                            value={quickBooksConfig.companyId || ''}
                            onChange={(e) => setQuickBooksConfig({...quickBooksConfig, companyId: e.target.value})}
                            placeholder="Company ID"
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-gray-600/50 focus:ring-1 focus:ring-gray-600/30"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="qb-environment" className="text-white">Environment</Label>
                            <Select 
                              value={quickBooksConfig.environment} 
                              onValueChange={(value) => setQuickBooksConfig({...quickBooksConfig, environment: value as 'sandbox' | 'production'})}
                            >
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="Select environment" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="sandbox">Sandbox</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="qb-token" className="text-white">Access Token</Label>
                          <Input
                            id="qb-token"
                            type="password"
                            value={quickBooksConfig.accessToken || ''}
                            onChange={(e) => setQuickBooksConfig({...quickBooksConfig, accessToken: e.target.value})}
                            placeholder="Access Token"
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-gray-600/50 focus:ring-1 focus:ring-gray-600/30"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            {showAdvancedConfig ? 'Hide' : 'Show'} Advanced Settings
                          </Button>
                        </div>

                        {showAdvancedConfig && (
                          <div className="space-y-2">
                            <Label htmlFor="qb-refresh-token" className="text-white">Refresh Token (Optional)</Label>
                            <Input
                              id="qb-refresh-token"
                              type="password"
                              value={quickBooksConfig.refreshToken || ''}
                              onChange={(e) => setQuickBooksConfig({...quickBooksConfig, refreshToken: e.target.value})}
                              placeholder="Refresh Token"
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-gray-600/50 focus:ring-1 focus:ring-gray-600/30"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url" className="text-white">{currentPlatform.name} Connection URL</Label>
                        <Input
                          id="webhook-url"
                          placeholder={currentPlatform.placeholderUrl}
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-gray-600/50 focus:ring-1 focus:ring-gray-600/30"
                        />
                        <p className="text-sm text-slate-400">
                          {currentPlatform.helpText}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className={`w-full bg-gradient-to-r ${currentPlatform.color} hover:${currentPlatform.hoverColor}`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Connect to {currentPlatform.name}
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-emerald-950/30 border border-emerald-700/30 text-emerald-300 rounded-md">
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400">
                          <path d="M10.28 4.22L5.78 8.72C5.69 8.81 5.56 8.86 5.44 8.86C5.31 8.86 5.19 8.81 5.1 8.72L2.78 6.4C2.59 6.21 2.59 5.91 2.78 5.72C2.97 5.53 3.27 5.53 3.46 5.72L5.44 7.7L9.6 3.54C9.79 3.35 10.09 3.35 10.28 3.54C10.47 3.73 10.47 4.03 10.28 4.22Z" fill="currentColor"></path>
                        </svg>
                      </div>
                      <div>{currentPlatform.name} account successfully connected</div>
                    </div>
                    
                    <div className="rounded-md border border-slate-700 bg-slate-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">Connection Details</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            Your P&L data is being synced from {currentPlatform.name}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDisconnect}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">P&L Data Actions</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full border-slate-600 bg-slate-700/30 text-white hover:bg-gray-800/50 hover:border-gray-600/50" 
                          onClick={handleRefreshData}
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          Sync Now
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-slate-600 bg-slate-700/30 text-white hover:bg-purple-900/50 hover:border-purple-500/50"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload P&L Report
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-lg text-white">Integration Help</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="rounded-md bg-gray-900/30 border border-gray-700/30 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-gray-300">
                        To generate a connection URL for {currentPlatform.name}, navigate to the API/Developer settings in your account.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-white">Connected Platforms:</h3>
                  <div className="space-y-1">
                    {connectedPlatforms.length > 0 ? (
                      <ul className="space-y-2">
                        {connectedPlatforms.map(platformId => {
                          const platform = accountingPlatforms.find(p => p.id === platformId);
                          return platform ? (
                            <li key={platformId} className="flex items-center bg-slate-700/30 p-2 rounded-md border border-slate-600/50">
                              <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${platform.color} flex items-center justify-center text-white text-xs font-semibold mr-2`}>
                                {platform.logo}
                              </div>
                              <span className="text-slate-200">{platform.name}</span>
                              <button 
                                onClick={() => handlePlatformChange(platformId)}
                                className="ml-auto text-xs text-slate-400 hover:text-white underline"
                              >
                                Manage
                              </button>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">No platforms connected yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
