
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Scan, Search, Package, Truck } from 'lucide-react';
import { ScanMode } from './BarcodeScanner';

interface BarcodeFloatingButtonProps {
  onScan: (mode: ScanMode) => void;
  className?: string;
}

const BarcodeFloatingButton: React.FC<BarcodeFloatingButtonProps> = ({
  onScan,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const scanOptions = [
    {
      mode: 'lookup' as ScanMode,
      label: 'Product Lookup',
      icon: Search,
      description: 'Find product information'
    },
    {
      mode: 'receiving' as ScanMode,
      label: 'Receive Items',
      icon: Package,
      description: 'Add items to inventory'
    },
    {
      mode: 'picking' as ScanMode,
      label: 'Pick Items',
      icon: Truck,
      description: 'Pick for orders'
    }
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-gray-800 hover:bg-gray-900 shadow-lg"
          >
            <Scan className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-neutral-800 border-neutral-700 z-[100]"
        >
          {scanOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.mode}
                onClick={() => {
                  onScan(option.mode);
                  setIsOpen(false);
                }}
                className="text-white hover:bg-neutral-700 cursor-pointer"
              >
                <Icon className="h-4 w-4 mr-3 text-neutral-400" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-neutral-400">{option.description}</div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BarcodeFloatingButton;
