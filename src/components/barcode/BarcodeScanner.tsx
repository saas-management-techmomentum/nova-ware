
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Scan, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle,
  Package,
  Search,
  Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type ScanMode = 'lookup' | 'receiving' | 'picking';

interface BarcodeScannerProps {
  mode: ScanMode;
  onScan: (barcode: string, mode: ScanMode) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  mode,
  onScan,
  onClose,
  isOpen
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getModeConfig = (mode: ScanMode) => {
    switch (mode) {
      case 'lookup':
        return {
          title: 'Product Lookup',
          icon: Search,
          description: 'Scan to find product information',
          color: 'bg-gray-500'
        };
      case 'receiving':
        return {
          title: 'Inventory Receiving',
          icon: Package,
          description: 'Scan items as they arrive',
          color: 'bg-green-500'
        };
      case 'picking':
        return {
          title: 'Order Picking',
          icon: Truck,
          description: 'Scan items for order fulfillment',
          color: 'bg-orange-500'
        };
    }
  };

  const modeConfig = getModeConfig(mode);
  const ModeIcon = modeConfig.icon;

  useEffect(() => {
    if (isOpen && isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use manual entry.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleScan = (barcode: string) => {
    setLastScan(barcode);
    onScan(barcode, mode);
    
    toast({
      title: "Barcode Scanned",
      description: `Scanned: ${barcode}`,
    });

    // Auto-clear last scan after 3 seconds
    setTimeout(() => {
      setLastScan(null);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-white">
              <ModeIcon className="h-5 w-5 mr-2 text-gray-400" />
              {modeConfig.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-400">{modeConfig.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Camera Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white">Camera Scanning</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScanning(!isScanning)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <Camera className="h-4 w-4 mr-1" />
                {isScanning ? 'Stop' : 'Start'} Camera
              </Button>
            </div>
            
            {isScanning && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-black rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center">
                  <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                    Position barcode in frame
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-3">
            <Label className="text-white">Manual Entry</Label>
            <div className="flex gap-2">
              <Input
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter barcode or UPC"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                autoFocus
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="bg-gray-800 hover:bg-gray-900 px-4"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Last Scan Display */}
          {lastScan && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">Last scan: {lastScan}</span>
            </div>
          )}

          {/* Mode-specific instructions */}
          <div className="text-xs text-slate-400 bg-slate-700/50 p-3 rounded-lg">
            <Badge className={`${modeConfig.color} text-white mb-2`}>
              {modeConfig.title}
            </Badge>
            <div className="space-y-1">
              {mode === 'lookup' && (
                <>
                  <p>• Scan any product barcode to view details</p>
                  <p>• Shows current stock and location info</p>
                </>
              )}
              {mode === 'receiving' && (
                <>
                  <p>• Scan items as they arrive in shipments</p>
                  <p>• Automatically updates inventory levels</p>
                </>
              )}
              {mode === 'picking' && (
                <>
                  <p>• Scan items during order fulfillment</p>
                  <p>• Verifies correct items are picked</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeScanner;
