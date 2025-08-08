
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Globe, Ship } from 'lucide-react';
import FedExIntegration from '@/components/integrations/FedExIntegration';
import UPSIntegration from '@/components/integrations/UPSIntegration';
import ShipStationIntegration from '@/components/integrations/ShipStationIntegration';
import USPSIntegration from '@/components/integrations/USPSIntegration';

const ShippingSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Shipping Settings</h2>
        <p className="text-sm text-slate-400">
          Configure your shipping carrier integrations and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FedExIntegration />
        <UPSIntegration />
        <ShipStationIntegration />
        <USPSIntegration />
      </div>
    </div>
  );
};

export default ShippingSettings;
