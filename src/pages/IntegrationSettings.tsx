
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopifyIntegration from '@/components/integrations/ShopifyIntegration';
import AmazonFBAIntegration from '@/components/integrations/AmazonFBAIntegration';

const IntegrationSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Integration Settings</h1>
        <p className="text-neutral-400 mt-2">
          Connect your e-commerce platforms to sync inventory and orders
        </p>
      </div>

      <Tabs defaultValue="shopify" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-neutral-800/50 border-neutral-700">
          <TabsTrigger 
            value="shopify" 
            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400"
          >
            Shopify
          </TabsTrigger>
          <TabsTrigger 
            value="amazon" 
            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400"
          >
            Amazon FBA
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shopify" className="mt-6">
          <ShopifyIntegration />
        </TabsContent>
        
        <TabsContent value="amazon" className="mt-6">
          <AmazonFBAIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationSettings;
