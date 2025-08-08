
import React from 'react';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';
import { ScanMode } from './BarcodeScanner';

interface BarcodeScanButtonProps {
  mode: ScanMode;
  onScan: (mode: ScanMode) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}

const BarcodeScanButton: React.FC<BarcodeScanButtonProps> = ({
  mode,
  onScan,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false
}) => {
  const getModeLabel = (mode: ScanMode) => {
    switch (mode) {
      case 'lookup':
        return 'Scan Product';
      case 'receiving':
        return 'Scan to Receive';
      case 'picking':
        return 'Scan to Pick';
      default:
        return 'Scan Barcode';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => !disabled && onScan(mode)}
      disabled={disabled}
      className={`${className} gap-2`}
    >
      <Scan className="h-4 w-4" />
      {getModeLabel(mode)}
    </Button>
  );
};

export default BarcodeScanButton;
