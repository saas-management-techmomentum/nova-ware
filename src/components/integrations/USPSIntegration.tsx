
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import uspsAdapter from '@/services/uspsAdapter';
import integrationService from '@/services/integrationService';

const USPSIntegration = () => {
  const { toast } = useToast();
  const [uspsConfig, setUspsConfig] = useState({
    userId: '',
    password: '',
    environment: 'test' as 'test' | 'production'
  });
  
  const [uspsStatus, setUspsStatus] = useState(uspsAdapter.getStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setUspsStatus(uspsAdapter.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUspsConnect = async () => {
    setIsLoading(true);
    try {
      if (!uspsConfig.userId) {
        toast({
          title: "Missing Configuration",
          description: "Please fill in User ID",
          variant: "destructive",
        });
        return;
      }

      uspsAdapter.configure({
        userId: uspsConfig.userId,
        password: uspsConfig.password,
        environment: uspsConfig.environment
      });

      const success = await uspsAdapter.initialize();
      
      if (success) {
        setUspsStatus(uspsAdapter.getStatus());
        toast({
          title: "USPS Connected",
          description: "Successfully connected to USPS",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to USPS. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('USPS connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to USPS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    uspsAdapter.getStatus().connected && integrationService.disconnect('usps');
    setUspsStatus(uspsAdapter.getStatus());
    setUspsConfig({
      userId: '',
      password: '',
      environment: 'test'
    });
    toast({
      title: "USPS Disconnected",
      description: "Successfully disconnected from USPS",
    });
  };

  const getStatusBadge = (status: any) => {
    return status.connected ? (
      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-slate-600 hover:bg-slate-700">
        <AlertCircle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Mail className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-white">USPS</CardTitle>
              <CardDescription>United States Postal Service</CardDescription>
            </div>
          </div>
          {getStatusBadge(uspsStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {uspsStatus.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{uspsStatus.error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usps-user-id" className="text-white">User ID</Label>
            <Input
              id="usps-user-id"
              placeholder="USPS User ID"
              value={uspsConfig.userId}
              onChange={(e) => setUspsConfig(prev => ({ ...prev, userId: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={uspsStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="usps-password" className="text-white">Password (Optional)</Label>
            <Input
              id="usps-password"
              type="password"
              placeholder="Password"
              value={uspsConfig.password}
              onChange={(e) => setUspsConfig(prev => ({ ...prev, password: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={uspsStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="usps-env" className="text-white">Environment</Label>
            <Select 
              value={uspsConfig.environment} 
              onValueChange={(value: 'test' | 'production') => setUspsConfig(prev => ({ ...prev, environment: value }))}
              disabled={uspsStatus.connected || isLoading}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
          {!uspsStatus.connected ? (
            <Button 
              onClick={handleUspsConnect}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect USPS'}
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

export default USPSIntegration;
