
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw, Unplug } from 'lucide-react';
import integrationService, { ServiceType } from '@/services/integrationService';

interface IntegrationStatusCardProps {
  serviceType: ServiceType;
  serviceName: string;
  onDisconnect?: () => void;
  onTestConnection?: () => void;
}

export const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({
  serviceType,
  serviceName,
  onDisconnect,
  onTestConnection
}) => {
  const status = integrationService.getServiceStatus(serviceType);
  const syncHistory = integrationService.getSyncHistory(serviceType);
  const lastSync = syncHistory[syncHistory.length - 1];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            {status.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {serviceName}
          </CardTitle>
          <Badge 
            variant={status.connected ? "default" : "destructive"}
            className={status.connected ? "bg-green-600" : ""}
          >
            {status.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status.connected && status.connectionDetails && (
          <div className="space-y-2 text-sm">
            {status.connectionDetails.companyName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Company:</span>
                <span className="text-white">{status.connectionDetails.companyName}</span>
              </div>
            )}
            {status.connectionDetails.environment && (
              <div className="flex justify-between">
                <span className="text-slate-400">Environment:</span>
                <span className="text-white capitalize">{status.connectionDetails.environment}</span>
              </div>
            )}
            {status.lastConnected && (
              <div className="flex justify-between">
                <span className="text-slate-400">Connected:</span>
                <span className="text-white">{status.lastConnected.toLocaleDateString()}</span>
              </div>
            )}
            {status.lastSyncDate && (
              <div className="flex justify-between">
                <span className="text-slate-400">Last Sync:</span>
                <span className="text-white">{status.lastSyncDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {status.error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md">
            <p className="text-red-300 text-sm">{status.error}</p>
          </div>
        )}

        {lastSync && (
          <div className="p-3 bg-slate-700/30 rounded-md">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Last Sync:</span>
              <Badge 
                variant={lastSync.status === 'completed' ? 'default' : lastSync.status === 'failed' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {lastSync.status}
              </Badge>
            </div>
            {lastSync.recordsProcessed && (
              <p className="text-xs text-slate-400 mt-1">
                {lastSync.recordsProcessed} records processed
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {onTestConnection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTestConnection}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test
            </Button>
          )}
          
          {status.connected && onDisconnect && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              <Unplug className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
