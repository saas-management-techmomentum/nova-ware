import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link, Shield, AlertTriangle, CheckCircle, RefreshCw, Plus, Unlink } from 'lucide-react';
import { useBankConnections } from '@/hooks/useBankConnections';
import { useToast } from '@/hooks/use-toast';

export const BankConnectionWidget = () => {
  const { toast } = useToast();
  const { 
    connectedAccounts, 
    isLoading, 
    initiateConnection, 
    refreshAccounts, 
    disconnectAccount,
    syncTransactions 
  } = useBankConnections();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnectBank = async () => {
    setIsConnecting(true);
    try {
      await initiateConnection();
      toast({ 
        title: "Bank connection initiated", 
        description: "Complete the authentication in the popup window" 
      });
    } catch (error: any) {
      console.error('Error initiating bank connection:', error);
      
      // Try to get more detailed error information
      let errorMessage = "Unable to connect to banking service";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Connection failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshAccounts = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccounts();
      await syncTransactions();
      toast({ 
        title: "Accounts refreshed", 
        description: "Bank data updated successfully" 
      });
    } catch (error) {
      toast({ 
        title: "Refresh failed", 
        description: "Unable to refresh bank data",
        variant: "destructive" 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string, bankName: string) => {
    try {
      await disconnectAccount(accountId);
      toast({ 
        title: "Account disconnected", 
        description: `${bankName} account has been disconnected` 
      });
    } catch (error) {
      toast({ 
        title: "Disconnect failed", 
        description: "Unable to disconnect account",
        variant: "destructive" 
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getConnectionStatus = (lastSync: string | null) => {
    if (!lastSync) return { status: 'never', color: 'secondary', icon: AlertTriangle };
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 1) return { status: 'healthy', color: 'default', icon: CheckCircle };
    if (hoursDiff < 24) return { status: 'good', color: 'default', icon: CheckCircle };
    return { status: 'stale', color: 'destructive', icon: AlertTriangle };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Connected Bank Accounts</CardTitle>
        <div className="flex gap-2">
          {connectedAccounts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAccounts}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button
            onClick={handleConnectBank}
            disabled={isConnecting}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Bank'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connectedAccounts.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Link className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Bank Connected</h3>
              <p className="text-muted-foreground mt-1">
                Connect your bank account to automatically sync transactions and balances
              </p>
            </div>
            <Button onClick={handleConnectBank} disabled={isConnecting}>
              <Plus className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Your Bank'}
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
              <Shield className="h-4 w-4" />
              <span>256-bit encryption • Read-only access • Bank-level security</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {connectedAccounts.map((account) => {
              const connectionStatus = getConnectionStatus(account.last_sync);
              const StatusIcon = connectionStatus.icon;
              
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-primary text-sm">
                        {account.bank_name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{account.bank_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} • 
                        ****{account.account_number.slice(-4)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(account.current_balance)}</p>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={`h-3 w-3 ${
                          connectionStatus.status === 'healthy' ? 'text-green-500' :
                          connectionStatus.status === 'good' ? 'text-green-500' :
                          'text-yellow-500'
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {account.last_sync ? 
                            `Synced ${new Date(account.last_sync).toLocaleDateString()}` : 
                            'Never synced'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <Badge variant={account.is_active ? 'default' : 'secondary'}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect Bank Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to disconnect {account.bank_name}? 
                            This will stop automatic transaction syncing for this account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDisconnectAccount(account.id, account.bank_name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4 border-t">
              <Shield className="h-4 w-4" />
              <span>Your data is encrypted and secure • We never store your bank credentials</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};