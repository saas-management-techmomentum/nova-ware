
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Ship, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import shipStationAdapter from '@/services/shipStationAdapter';
import integrationService from '@/services/integrationService';

const ShipStationIntegration = () => {
  const { toast } = useToast();
  const [shipStationConfig, setShipStationConfig] = useState({
    apiKey: '',
    apiSecret: '',
    storeId: ''
  });
  
  const [shipStationStatus, setShipStationStatus] = useState(shipStationAdapter.getStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShipStationStatus(shipStationAdapter.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleShipStationConnect = async () => {
    setIsLoading(true);
    try {
      if (!shipStationConfig.apiKey || !shipStationConfig.apiSecret) {
        toast({
          title: "Missing Configuration",
          description: "Please fill in API Key and API Secret",
          variant: "destructive",
        });
        return;
      }

      shipStationAdapter.configure({
        apiKey: shipStationConfig.apiKey,
        apiSecret: shipStationConfig.apiSecret,
        storeId: shipStationConfig.storeId
      });

      const success = await shipStationAdapter.initialize();
      
      if (success) {
        setShipStationStatus(shipStationAdapter.getStatus());
        toast({
          title: "ShipStation Connected",
          description: "Successfully connected to ShipStation",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to ShipStation. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('ShipStation connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to ShipStation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    shipStationAdapter.getStatus().connected && integrationService.disconnect('shipstation');
    setShipStationStatus(shipStationAdapter.getStatus());
    setShipStationConfig({
      apiKey: '',
      apiSecret: '',
      storeId: ''
    });
    toast({
      title: "ShipStation Disconnected",
      description: "Successfully disconnected from ShipStation",
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
              <Ship className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-white">ShipStation</CardTitle>
              <CardDescription>Multi-carrier shipping platform</CardDescription>
            </div>
          </div>
          {getStatusBadge(shipStationStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {shipStationStatus.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{shipStationStatus.error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shipstation-api-key" className="text-white">API Key</Label>
            <Input
              id="shipstation-api-key"
              placeholder="API Key"
              value={shipStationConfig.apiKey}
              onChange={(e) => setShipStationConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={shipStationStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shipstation-api-secret" className="text-white">API Secret</Label>
            <Input
              id="shipstation-api-secret"
              type="password"
              placeholder="API Secret"
              value={shipStationConfig.apiSecret}
              onChange={(e) => setShipStationConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={shipStationStatus.connected || isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shipstation-store-id" className="text-white">Store ID (Optional)</Label>
            <Input
              id="shipstation-store-id"
              placeholder="Store ID"
              value={shipStationConfig.storeId}
              onChange={(e) => setShipStationConfig(prev => ({ ...prev, storeId: e.target.value }))}
              className="bg-neutral-700 border-neutral-600 text-white"
              disabled={shipStationStatus.connected || isLoading}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {!shipStationStatus.connected ? (
            <Button 
              onClick={handleShipStationConnect}
              className="bg-gray-800 hover:bg-gray-900"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect ShipStation'}
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

export default ShipStationIntegration;
