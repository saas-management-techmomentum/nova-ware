import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Package, 
  ArrowRight, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Scan
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface PickLocation {
  id: string;
  palletId: string;
  palletLocation: string;
  quantityToPick: number;
  pickOrder: number;
  currentQuantity: number;
  quantityPicked?: number;
  expirationDate?: string;
}

export interface PickInstruction {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  totalQuantity: number;
  pickSequence: number;
  locations: PickLocation[];
  picked: boolean;
  pickedQuantity: number;
}

interface PickInstructionsPanelProps {
  orderId: string;
  pickInstructions: PickInstruction[];
  pickingStrategy: 'FIFO' | 'LIFO';
  onPickingStrategyChange: (strategy: 'FIFO' | 'LIFO') => void;
  onRegenerateInstructions: () => void;
  onMarkItemPicked: (instructionId: string, locationId: string, quantity: number) => void;
  onValidatePick: (instructionId: string, locationId: string) => void;
}

const PickInstructionsPanel: React.FC<PickInstructionsPanelProps> = ({
  orderId,
  pickInstructions,
  pickingStrategy,
  onPickingStrategyChange,
  onRegenerateInstructions,
  onMarkItemPicked,
  onValidatePick,
}) => {
  const { toast } = useToast();
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  const toggleInstructionExpansion = (instructionId: string) => {
    const newExpanded = new Set(expandedInstructions);
    if (newExpanded.has(instructionId)) {
      newExpanded.delete(instructionId);
    } else {
      newExpanded.add(instructionId);
    }
    setExpandedInstructions(newExpanded);
  };

  const handlePickComplete = (instructionId: string, locationId: string, quantity: number) => {
    onMarkItemPicked(instructionId, locationId, quantity);
    toast({
      title: "Pick Completed",
      description: `Picked ${quantity} units from location`,
    });
  };

  const getCompletionStatus = () => {
    const totalInstructions = pickInstructions.length;
    const completedInstructions = pickInstructions.filter(i => i.picked).length;
    return { completed: completedInstructions, total: totalInstructions };
  };

  const status = getCompletionStatus();

  return (
    <Card className="bg-slate-700/30 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Package className="h-4 w-4 mr-2 text-gray-400" />
            Pick Instructions
            <Badge className="ml-2 bg-gray-700/20 text-gray-300 border-gray-600/30">
              {status.completed} / {status.total}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {pickingStrategy}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-600/30 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Picking Strategy</span>
              <Select value={pickingStrategy} onValueChange={onPickingStrategyChange}>
                <SelectTrigger className="w-24 h-7 bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIFO">FIFO</SelectItem>
                  <SelectItem value="LIFO">LIFO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateInstructions}
              className="h-7 text-xs"
            >
              Regenerate Instructions
            </Button>
          </div>
        )}

        {/* Pick Instructions List */}
        <div className="space-y-2">
          {pickInstructions.map((instruction) => (
            <div key={instruction.id} className="border border-slate-600 rounded-lg overflow-hidden">
              {/* Instruction Header */}
              <div
                className={`p-3 cursor-pointer transition-colors ${
                  instruction.picked 
                    ? 'bg-green-500/10 hover:bg-green-500/20' 
                    : 'bg-slate-600/30 hover:bg-slate-600/40'
                }`}
                onClick={() => toggleInstructionExpansion(instruction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {instruction.picked ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Package className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <div className="font-medium text-white text-sm">
                        {instruction.productName}
                      </div>
                      <div className="text-xs text-slate-400">
                        SKU: {instruction.sku} • Total: {instruction.totalQuantity} units
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-600/50 text-slate-300 text-xs">
                      {instruction.locations.length} location(s)
                    </Badge>
                    {instruction.picked && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Picked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Locations */}
              {expandedInstructions.has(instruction.id) && (
                <div className="border-t border-slate-600 bg-slate-700/20">
                  <div className="p-3 space-y-2">
                    {instruction.locations.map((location, index) => (
                      <div key={location.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span className="font-mono">{index + 1}.</span>
                          </div>
                          <MapPin className="h-4 w-4 text-emerald-400" />
                          <div>
                            <div className="font-medium text-white text-sm">
                              {location.palletLocation}
                            </div>
                            <div className="text-xs text-slate-400">
                              Pick {location.quantityToPick} units • Available: {location.currentQuantity}
                            </div>
                            {location.expirationDate && (
                              <div className="text-xs text-amber-400">
                                Exp: {new Date(location.expirationDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {location.currentQuantity < location.quantityToPick && (
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onValidatePick(instruction.id, location.id)}
                            className="h-7 px-2 border-slate-500"
                          >
                            <Scan className="h-3 w-3 mr-1" />
                            Scan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePickComplete(instruction.id, location.id, location.quantityToPick)}
                            className="h-7 px-2 bg-green-600/20 border-green-500/30 hover:bg-green-600/30"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pick
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {pickInstructions.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pick instructions generated yet</p>
            <p className="text-xs mt-1">Start the workflow to generate pick instructions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PickInstructionsPanel;