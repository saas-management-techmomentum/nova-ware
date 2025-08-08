import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon, RefreshCw, Settings, Check, AlertCircle } from 'lucide-react';
import integrationService from '@/services/integrationService';
import quickBooksAdapter, { QuickBooksConfig } from '@/services/quickBooksAdapter';
import { IntegrationStatusCard } from './IntegrationStatusCard';
import { SyncDataDialog } from './SyncDataDialog';

// Accounting platform configurations
const accountingPlatforms = [
  { 
    id: 'quickbooks', 
    name: 'QuickBooks Online', 
    logo: 'Q',
    color: 'from-green-600 to-emerald-600',
    hoverColor: 'from-green-500 to-emerald-500',
    placeholderUrl: 'https://quickbooks.api.intuit.com/v3/company/your-company-id',
    helpText: 'Enter your QuickBooks API credentials to sync your financial data.',
    hasAdvancedConfig: true,
    features: ['Invoices', 'Customers', 'Items', 'Payments', 'Reports']
  },
  { 
    id: 'xero', 
    name: 'Xero', 
    logo: 'X',
    color: 'from-sky-600 to-cyan-600',
    hoverColor: 'from-sky-500 to-cyan-500',
    placeholderUrl: 'https://api.xero.com/api.xro/2.0/your-organization-id',
    helpText: 'Connect your Xero organization to sync accounting data.',
    features: ['Invoices', 'Contacts', 'Items', 'Bank Transactions']
  },
  { 
    id: 'wave', 
    name: 'Wave Accounting', 
    logo: 'W',
    color: 'from-blue-600 to-indigo-600',
    hoverColor: 'from-blue-500 to-indigo-500',
    placeholderUrl: 'https://api.waveapps.com/webhook/your-webhook-id',
    helpText: 'Use Wave\'s webhook URL to sync your financial data.',
    features: ['Invoices', 'Customers', 'Payments']
  },
  { 
    id: 'sage', 
    name: 'Sage', 
    logo: 'S',
    color: 'from-teal-600 to-emerald-600',
    hoverColor: 'from-teal-500 to-emerald-500',
    placeholderUrl: 'https://api.accounting.sage.com/v3.1/your-business-id',
    helpText: 'Connect to your Sage accounting system.',
    features: ['Invoices', 'Customers', 'Products', 'Transactions']
  },
  { 
    id: 'freshbooks', 
    name: 'FreshBooks', 
    logo: 'F',
    color: 'from-orange-600 to-amber-600',
    hoverColor: 'from-orange-500 to-amber-500',
    placeholderUrl: 'https://api.freshbooks.com/auth/oauth/your-token',
    helpText: 'Connect your FreshBooks account to sync invoices and clients.',
    features: ['Invoices', 'Clients', 'Projects', 'Time Tracking']
  }
];

export const AccountingIntegrations = () => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(accountingPlatforms[0].id);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncService, setSyncService] = useState<{type: any, name: string} | null>(null);

  // QuickBooks configuration state
  const [quickBooksConfig, setQuickBooksConfig] = useState<QuickBooksConfig>({
    companyId: '',
    accessToken: '',
    refreshToken: '',
    environment: 'sandbox',
  });

  // Load connected platforms on component mount
  useEffect(() => {
    const connected = integrationService.getConnectedServices();
    setConnectedPlatforms(connected);
  }, []);

  // Get current platform data
  const currentPlatform = accountingPlatforms.find(p => p.id === selectedPlatform) || accountingPlatforms[0];
  const isConnected = connectedPlatforms.includes(currentPlatform.id);

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
      integrationService.configureService(currentPlatform.id as any, {
        webhookUrl: webhookUrl,
        endpoint: webhookUrl,
      });
      
      // Test the connection
      const connectionSuccess = await integrationService.testConnection(currentPlatform.id as any);
      
      if (connectionSuccess) {
        setConnectedPlatforms(prev => [...prev.filter(p => p !== currentPlatform.id), currentPlatform.id]);
        
        toast({
          title: `Connected to ${currentPlatform.name}`,
          description: "Your financial data integration is now active.",
        });
      }
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

  const handleDisconnect = (platformId: string) => {
    integrationService.disconnect(platformId as any);
    setConnectedPlatforms(prev => prev.filter(p => p !== platformId));
    setWebhookUrl('');
    
    if (platformId === 'quickbooks') {
      setQuickBooksConfig({
        companyId: '',
        accessToken: '',
        refreshToken: '',
        environment: 'sandbox',
      });
    }
    
    toast({
      title: "Disconnected",
      description: `Your ${accountingPlatforms.find(p => p.id === platformId)?.name} account has been disconnected.`,
    });
  };

  const handleTestConnection = async (platformId: string) => {
    try {
      setIsLoading(true);
      const success = await integrationService.testConnection(platformId as any);
      
      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success 
          ? `Successfully connected to ${accountingPlatforms.find(p => p.id === platformId)?.name}`
          : `Failed to connect to ${accountingPlatforms.find(p => p.id === platformId)?.name}`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Unable to test connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = (platformId: string) => {
    const platform = accountingPlatforms.find(p => p.id === platformId);
    if (platform) {
      setSyncService({ type: platformId, name: platform.name });
      setShowSyncDialog(true);
    }
  };

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatform(platformId);
    setWebhookUrl('');
    setShowAdvancedConfig(false);
    
    if (platformId !== 'quickbooks') {
      setQuickBooksConfig({
        companyId: '',
        accessToken: '',
        refreshToken: '',
        environment: 'sandbox',
      });
    }
  };

  // Get integration summary
  const integrationSummary = integrationService.getIntegrationSummary();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Accounting Platform Integrations</h2>
          <p className="text-slate-400 mt-1">
            Connect your accounting platforms to sync financial data automatically
          </p>
        </div>
        
        {integrationSummary.totalConnected > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{integrationSummary.totalConnected}</div>
            <div className="text-sm text-slate-400">Connected Services</div>
          </div>
        )}
      </div>

      {/* Connected Services Overview */}
      {connectedPlatforms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedPlatforms.map(platformId => {
            const platform = accountingPlatforms.find(p => p.id === platformId);
            if (!platform) return null;
            
            return (
              <IntegrationStatusCard
                key={platformId}
                serviceType={platformId as any}
                serviceName={platform.name}
                onDisconnect={() => handleDisconnect(platformId)}
                onTestConnection={() => handleTestConnection(platformId)}
              />
            );
          })}
        </div>
      )}

      {/* Connection Setup */}
      <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-md overflow-hidden">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-lg text-white">Connect New Accounting Platform</CardTitle>
          <CardDescription className="text-slate-400">
            Choose and configure an accounting platform integration
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
                    className={`relative h-20 flex flex-col items-center justify-center p-2 border-slate-700 transition-all
                      ${selectedPlatform === platform.id ? 'bg-slate-700/70 border-slate-500 ring-1 ring-slate-400' : 'bg-slate-800/30 hover:bg-slate-700/30'}
                      ${connectedPlatforms.includes(platform.id) ? 'border-green-500/30' : ''}
                    `}
                    onClick={() => handlePlatformChange(platform.id)}
                  >
                    <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-semibold transition-all group-hover:${platform.hoverColor}`}>
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

            {/* Platform Features */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">{currentPlatform.name} Features</h4>
              <div className="flex flex-wrap gap-2">
                {currentPlatform.features?.map((feature) => (
                  <span 
                    key={feature}
                    className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-md"
                  >
                    {feature}
                  </span>
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
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
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
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
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
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
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
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
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
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>{currentPlatform.name} account successfully connected</div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleSync(currentPlatform.id)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleTestConnection(currentPlatform.id)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleDisconnect(currentPlatform.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Data Dialog */}
      <SyncDataDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        serviceType={syncService?.type || null}
        serviceName={syncService?.name || ''}
      />
    </div>
  );
};
