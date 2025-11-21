
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fedExAdapter from '@/services/fedExAdapter';
import integrationService from '@/services/integrationService';

const FedExIntegration = () => {
  const { toast } = useToast();
  const [fedExConfig, setFedExConfig] = useState({
    accountNumber: '',
    meterNumber: '',
    userKey: '',
    userPassword: '',
    environment: 'test' as 'test' | 'production'
  });
  
  const [fedExStatus, setFedExStatus] = useState(fedExAdapter.getStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFedExStatus(fedExAdapter.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleFedExConnect = async () => {
    setIsLoading(true);
    try {
      if (!fedExConfig.accountNumber || !fedExConfig.meterNumber || !fedExConfig.userKey || !fedExConfig.userPassword) {
        toast({
          title: "Missing Configuration",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      fedExAdapter.configure({
        accountNumber: fedExConfig.accountNumber,
        meterNumber: fedExConfig.meterNumber,
        userKey: fedExConfig.userKey,
        userPassword: fedExConfig.userPassword,
        environment: fedExConfig.environment
      });

      const success = await fedExAdapter.initialize();
      
      if (success) {
        setFedExStatus(fedExAdapter.getStatus());
        toast({
          title: "FedEx Connected",
          description: "Successfully connected to FedEx",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to FedEx. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('FedEx connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to FedEx",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    fedExAdapter.getStatus().connected && integrationService.disconnect('fedex');
    setFedExStatus(fedExAdapter.getStatus());
    setFedExConfig({
      accountNumber: '',
      meterNumber: '',
      userKey: '',
      userPassword: '',
      environment: 'test'
    });
    toast({
      title: "FedEx Disconnected",
      description: "Successfully disconnected from FedEx",
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
              <Truck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">FedEx</CardTitle>
              <CardDescription>Connect to FedEx for shipping and tracking</CardDescription>
            </div>
          </div>
          {getStatusBadge(fedExStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fedExStatus.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{fedExStatus.error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fedex-account" className="text-white">Account Number</Label>
              <Input
                id="fedex-account"
                placeholder="123456789"
                value={fedExConfig.accountNumber}
                onChange={(e) => setFedExConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                className="bg-neutral-700 border-neutral-600 text-white"
                disabled={fedExStatus.connected || isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fedex-meter" className="text-white">Meter Number</Label>
              <Input
                id="fedex-meter"
                placeholder="123456789"
                value={fedExConfig.meterNumber}
                onChange={(e) => setFedExConfig(prev => ({ ...prev, meterNumber: e.target.value }))}
                className="bg-neutral-700 border-neutral-600 text-white"
                disabled={fedExStatus.connected || isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fedex-key" className="text-white">User Key</Label>
            <Input
              id="fedex-key"
              placeholder="User key"
              value={fedExConfig.userKey}
              onChange={(e) => setFedExConfig(prev => ({ ...prev, userKey: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={fedExStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fedex-password" className="text-white">User Password</Label>
            <Input
              id="fedex-password"
              type="password"
              placeholder="User password"
              value={fedExConfig.userPassword}
              onChange={(e) => setFedExConfig(prev => ({ ...prev, userPassword: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={fedExStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fedex-env" className="text-white">Environment</Label>
            <Select 
              value={fedExConfig.environment} 
              onValueChange={(value: 'test' | 'production') => setFedExConfig(prev => ({ ...prev, environment: value }))}
              disabled={fedExStatus.connected || isLoading}
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
          {!fedExStatus.connected ? (
            <Button 
              onClick={handleFedExConnect}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect FedEx'}
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

export default FedExIntegration;
