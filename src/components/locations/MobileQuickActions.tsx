
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, 
  Move, 
  Package, 
  MapPin, 
  ArrowRightLeft, 
  AlertCircle,
  CheckCircle,
  Mic,
  MicOff,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MobileQuickActionsProps {
  onScanLocation: () => void;
  onBulkMove: () => void;
  onMarkEmpty: () => void;
  onVoiceCommand: () => void;
  className?: string;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onScanLocation,
  onBulkMove,
  onMarkEmpty,
  onVoiceCommand,
  className
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toast } = useToast();

  // Monitor online/offline status
  React.useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    onVoiceCommand();
    
    if (!isListening) {
      toast({
        title: "Voice Command Active",
        description: "Say 'move item' or 'scan location' to start",
      });
    }
  };

  const quickActions = [
    {
      icon: Scan,
      label: 'Scan Location',
      action: onScanLocation,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Quick barcode scan'
    },
    {
      icon: Move,
      label: 'Move Items',
      action: onBulkMove,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Bulk move operations'
    },
    {
      icon: Package,
      label: 'Mark Empty',
      action: onMarkEmpty,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Clear location'
    },
    {
      icon: isListening ? MicOff : Mic,
      label: isListening ? 'Stop Voice' : 'Voice Command',
      action: handleVoiceCommand,
      color: isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600',
      description: 'Hands-free control'
    }
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status Bar */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-slate-300">Mobile Mode</span>
            </div>
            <div className="flex items-center gap-2">
              {isOffline ? (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              ) : (
                <Badge className="bg-green-500 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              )}
              {isListening && (
                <Badge className="bg-purple-500 text-xs animate-pulse">
                  <Mic className="h-3 w-3 mr-1" />
                  Listening
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              onClick={action.action}
              className={cn(
                "h-20 flex flex-col items-center justify-center gap-2 text-white shadow-lg transition-all duration-200 active:scale-95",
                action.color
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Recent Actions */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Recent Actions</span>
            <ArrowRightLeft className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <div>• Scanned location A1-01 - 2 min ago</div>
            <div>• Moved 5 items to B2-03 - 5 min ago</div>
            <div>• Marked A3-05 as empty - 8 min ago</div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Notice */}
      {isOffline && (
        <Card className="bg-yellow-500/20 border-yellow-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                Working offline. Changes will sync when connection is restored.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileQuickActions;
