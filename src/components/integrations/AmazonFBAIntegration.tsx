
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import amazonFBAAdapter from '@/services/amazonFBAAdapter';

const AmazonFBAIntegration = () => {
  const { toast } = useToast();
  const [amazonConfig, setAmazonConfig] = useState({
    sellerId: '',
    marketplaceId: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });
  
  const [amazonStatus, setAmazonStatus] = useState(amazonFBAAdapter.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setAmazonStatus(amazonFBAAdapter.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAmazonConnect = async () => {
    try {
      if (!amazonConfig.sellerId || !amazonConfig.accessKeyId || !amazonConfig.secretAccessKey) {
        toast({
          title: "Missing Configuration",
          description: "Please fill in Seller ID, Access Key ID, and Secret Access Key",
          variant: "destructive",
        });
        return;
      }

      amazonFBAAdapter.configure({
        sellerId: amazonConfig.sellerId,
        marketplaceId: amazonConfig.marketplaceId,
        accessKeyId: amazonConfig.accessKeyId,
        secretAccessKey: amazonConfig.secretAccessKey,
        region: amazonConfig.region
      });

      const success = await amazonFBAAdapter.initialize();
      
      if (success) {
        setAmazonStatus(amazonFBAAdapter.getStatus());
        toast({
          title: "Amazon FBA Connected",
          description: "Successfully connected to Amazon FBA",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Amazon FBA. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Amazon FBA connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to Amazon FBA",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    amazonFBAAdapter.disconnect?.();
    setAmazonStatus(amazonFBAAdapter.getStatus());
    setAmazonConfig({
      sellerId: '',
      marketplaceId: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1'
    });
    toast({
      title: "Amazon FBA Disconnected",
      description: "Successfully disconnected from Amazon FBA",
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
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-white">Amazon FBA Integration</CardTitle>
              <CardDescription>Sync inventory and fulfillment data from Amazon FBA</CardDescription>
            </div>
          </div>
          {getStatusBadge(amazonStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {amazonStatus.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{amazonStatus.error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amazon-seller-id" className="text-white">Seller ID</Label>
            <Input
              id="amazon-seller-id"
              placeholder="A1BCDEF2GHIJKL"
              value={amazonConfig.sellerId}
              onChange={(e) => setAmazonConfig(prev => ({ ...prev, sellerId: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={amazonStatus.connected}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amazon-marketplace" className="text-white">Marketplace ID</Label>
            <Input
              id="amazon-marketplace"
              placeholder="ATVPDKIKX0DER (US)"
              value={amazonConfig.marketplaceId}
              onChange={(e) => setAmazonConfig(prev => ({ ...prev, marketplaceId: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={amazonStatus.connected}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amazon-access-key" className="text-white">Access Key ID</Label>
            <Input
              id="amazon-access-key"
              placeholder="AKIA..."
              value={amazonConfig.accessKeyId}
              onChange={(e) => setAmazonConfig(prev => ({ ...prev, accessKeyId: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={amazonStatus.connected}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amazon-secret-key" className="text-white">Secret Access Key</Label>
            <Input
              id="amazon-secret-key"
              type="password"
              placeholder="Secret access key"
              value={amazonConfig.secretAccessKey}
              onChange={(e) => setAmazonConfig(prev => ({ ...prev, secretAccessKey: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={amazonStatus.connected}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amazon-region" className="text-white">Region</Label>
            <Input
              id="amazon-region"
              placeholder="us-east-1"
              value={amazonConfig.region}
              onChange={(e) => setAmazonConfig(prev => ({ ...prev, region: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={amazonStatus.connected}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {!amazonStatus.connected ? (
            <Button 
              onClick={handleAmazonConnect}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Connect Amazon FBA
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AmazonFBAIntegration;
