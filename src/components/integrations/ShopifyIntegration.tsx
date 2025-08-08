
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import shopifyAdapter from '@/services/shopifyAdapter';

const ShopifyIntegration = () => {
  const { toast } = useToast();
  const [shopifyConfig, setShopifyConfig] = useState({
    shopDomain: '',
    accessToken: '',
    webhookSecret: ''
  });
  
  const [shopifyStatus, setShopifyStatus] = useState(shopifyAdapter.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setShopifyStatus(shopifyAdapter.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleShopifyConnect = async () => {
    try {
      if (!shopifyConfig.shopDomain || !shopifyConfig.accessToken) {
        toast({
          title: "Missing Configuration",
          description: "Please fill in both Shop Domain and Access Token",
          variant: "destructive",
        });
        return;
      }

      shopifyAdapter.configure({
        shopDomain: shopifyConfig.shopDomain,
        accessToken: shopifyConfig.accessToken,
        webhookSecret: shopifyConfig.webhookSecret
      });

      const success = await shopifyAdapter.initialize();
      
      if (success) {
        setShopifyStatus(shopifyAdapter.getStatus());
        toast({
          title: "Shopify Connected",
          description: "Successfully connected to your Shopify store",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Shopify. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Shopify connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to Shopify",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    shopifyAdapter.disconnect?.();
    setShopifyStatus(shopifyAdapter.getStatus());
    setShopifyConfig({
      shopDomain: '',
      accessToken: '',
      webhookSecret: ''
    });
    toast({
      title: "Shopify Disconnected",
      description: "Successfully disconnected from Shopify",
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
              <Globe className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-white">Shopify Integration</CardTitle>
              <CardDescription>Sync orders and inventory data from your Shopify store</CardDescription>
            </div>
          </div>
          {getStatusBadge(shopifyStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {shopifyStatus.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{shopifyStatus.error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopify-domain" className="text-white">Shop Domain</Label>
            <Input
              id="shopify-domain"
              placeholder="your-shop.myshopify.com"
              value={shopifyConfig.shopDomain}
              onChange={(e) => setShopifyConfig(prev => ({ ...prev, shopDomain: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={shopifyStatus.connected}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shopify-token" className="text-white">Access Token</Label>
            <Input
              id="shopify-token"
              type="password"
              placeholder="shpat_..."
              value={shopifyConfig.accessToken}
              onChange={(e) => setShopifyConfig(prev => ({ ...prev, accessToken: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={shopifyStatus.connected}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shopify-webhook" className="text-white">Webhook Secret (Optional)</Label>
            <Input
              id="shopify-webhook"
              type="password"
              placeholder="Webhook verification secret"
              value={shopifyConfig.webhookSecret}
              onChange={(e) => setShopifyConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              disabled={shopifyStatus.connected}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {!shopifyStatus.connected ? (
            <Button 
              onClick={handleShopifyConnect}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Connect Shopify
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

export default ShopifyIntegration;
