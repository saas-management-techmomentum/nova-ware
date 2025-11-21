
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

type PricingDisplayMode = 'unit' | 'case' | 'both';

interface PricingDisplaySelectorProps {
  value: PricingDisplayMode;
  onChange: (value: PricingDisplayMode) => void;
}

const PricingDisplaySelector: React.FC<PricingDisplaySelectorProps> = ({ value, onChange }) => {
  return (
    <>
      <div></div>
      {/* <div className="flex items-center gap-4 bg-slate-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-slate-300">
          <DollarSign className="h-4 w-4" />
          <span className="text-sm font-medium">Price Display:</span>
        </div>
        <RadioGroup
          value={value}
          onValueChange={(newValue) => onChange(newValue as PricingDisplayMode)}
          className="flex flex-row gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unit" id="unit" className="border-slate-500 text-indigo-400" />
            <Label htmlFor="unit" className="text-slate-300 text-sm cursor-pointer">
              Unit Price
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="case" id="case" className="border-slate-500 text-indigo-400" />
            <Label htmlFor="case" className="text-slate-300 text-sm cursor-pointer">
              Case Price
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="both" id="both" className="border-slate-500 text-indigo-400" />
            <Label htmlFor="both" className="text-slate-300 text-sm cursor-pointer">
              Both Prices
            </Label>
          </div>
        </RadioGroup>
      </div> */}
    </>
  );
};

export default PricingDisplaySelector;
