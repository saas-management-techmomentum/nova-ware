
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import upsAdapter from '@/services/upsAdapter';
import integrationService from '@/services/integrationService';

const UPSIntegration = () => {
  const { toast } = useToast();
  const [upsConfig, setUpsConfig] = useState({
    accessKey: '',
    userId: '',
    password: '',
    accountNumber: '',
    environment: 'test' as 'test' | 'production'
  });
  
  const [upsStatus, setUpsStatus] = useState(upsAdapter.getStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpsStatus(upsAdapter.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUpsConnect = async () => {
    setIsLoading(true);
    try {
      if (!upsConfig.accessKey || !upsConfig.userId || !upsConfig.password) {
        toast({
          title: "Missing Configuration",
          description: "Please fill in Access Key, User ID, and Password",
          variant: "destructive",
        });
        return;
      }

      upsAdapter.configure({
        accessKey: upsConfig.accessKey,
        userId: upsConfig.userId,
        password: upsConfig.password,
        accountNumber: upsConfig.accountNumber,
        environment: upsConfig.environment
      });

      const success = await upsAdapter.initialize();
      
      if (success) {
        setUpsStatus(upsAdapter.getStatus());
        toast({
          title: "UPS Connected",
          description: "Successfully connected to UPS",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to UPS. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('UPS connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to UPS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    upsAdapter.getStatus().connected && integrationService.disconnect('ups');
    setUpsStatus(upsAdapter.getStatus());
    setUpsConfig({
      accessKey: '',
      userId: '',
      password: '',
      accountNumber: '',
      environment: 'test'
    });
    toast({
      title: "UPS Disconnected",
      description: "Successfully disconnected from UPS",
    });
  };

  const getStatusBadge = (status: any) => {
    return status.connected ? (
      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-neutral-600 hover:bg-neutral-700">
        <AlertCircle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  return (
    <Card className="bg-neutral-800/50 border-neutral-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-700 rounded-lg">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white">UPS</CardTitle>
              <CardDescription>Connect to UPS for shipping and tracking</CardDescription>
            </div>
          </div>
          {getStatusBadge(upsStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upsStatus.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{upsStatus.error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ups-access-key" className="text-white">Access Key</Label>
            <Input
              id="ups-access-key"
              placeholder="Access key"
              value={upsConfig.accessKey}
              onChange={(e) => setUpsConfig(prev => ({ ...prev, accessKey: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={upsStatus.connected || isLoading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ups-user-id" className="text-white">User ID</Label>
              <Input
                id="ups-user-id"
                placeholder="User ID"
                value={upsConfig.userId}
                onChange={(e) => setUpsConfig(prev => ({ ...prev, userId: e.target.value }))}
                className="bg-neutral-700 border-neutral-600 text-white"
                disabled={upsStatus.connected || isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ups-password" className="text-white">Password</Label>
              <Input
                id="ups-password"
                type="password"
                placeholder="Password"
                value={upsConfig.password}
                onChange={(e) => setUpsConfig(prev => ({ ...prev, password: e.target.value }))}
                className="bg-neutral-700 border-neutral-600 text-white"
                disabled={upsStatus.connected || isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ups-account" className="text-white">Account Number (Optional)</Label>
            <Input
              id="ups-account"
              placeholder="Account number"
              value={upsConfig.accountNumber}
              onChange={(e) => setUpsConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={upsStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ups-env" className="text-white">Environment</Label>
            <Select 
              value={upsConfig.environment} 
              onValueChange={(value: 'test' | 'production') => setUpsConfig(prev => ({ ...prev, environment: value }))}
              disabled={upsStatus.connected || isLoading}
            >
              <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!upsStatus.connected ? (
            <Button 
              onClick={handleUpsConnect}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect UPS'}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
              disabled={isLoading}
            >
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UPSIntegration;
