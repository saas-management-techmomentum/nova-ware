import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, AlertCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PalletLocation, usePalletLocations } from '@/hooks/usePalletLocations';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: PalletLocation | null;
  onUpdateLocation: (locationId: string, updates: Partial<PalletLocation>) => Promise<void>;
}

const EditLocationDialog: React.FC<EditLocationDialogProps> = ({
  open,
  onOpenChange,
  location,
  onUpdateLocation
}) => {
  const { toast } = useToast();
  const { checkLocationIdExists } = usePalletLocations();
  const [locationId, setLocationId] = useState('');
  const [zone, setZone] = useState('');
  const [aisle, setAisle] = useState('');
  const [section, setSection] = useState('');
  const [shelf, setShelf] = useState('');
  const [bin, setBin] = useState('');
  const [locationType, setLocationType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [temperature, setTemperature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse location string into components
  const parseLocationString = (locationString: string) => {
    const parts = locationString.split('-');
    return {
      zone: parts[0] || '',
      aisle: parts[1] || '',
      section: parts[2] || '',
      shelf: parts[3] || '',
      bin: parts[4] || ''
    };
  };

  // Generate location string from components
  const generateLocationString = () => {
    const parts = [zone, aisle, section, shelf, bin].filter(Boolean);
    return parts.join('-');
  };

  // Initialize form with location data
  useEffect(() => {
    if (location && open) {
      setLocationId(location.id);
      
      const parsed = parseLocationString(location.location);
      setZone(parsed.zone);
      setAisle(parsed.aisle);
      setSection(parsed.section);
      setShelf(parsed.shelf);
      setBin(parsed.bin);
      
      // Set defaults for new fields
      setLocationType('pallet');
      setCapacity('100');
      setTemperature('ambient');
    }
  }, [location, open]);

  const resetForm = () => {
    setLocationId('');
    setZone('');
    setAisle('');
    setSection('');
    setShelf('');
    setBin('');
    setLocationType('');
    setCapacity('');
    setTemperature('');
    setIsSubmitting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const getMissingFields = () => {
    const missing = [];
    if (!locationId) missing.push('Location ID');
    if (!zone) missing.push('Zone');
    if (!aisle) missing.push('Aisle');
    if (!section) missing.push('Section');
    if (!locationType) missing.push('Location Type');
    return missing;
  };

  const missingFields = getMissingFields();
  const isFormValid = missingFields.length === 0;
  const hasChanges = location && (
    locationId !== location.id ||
    generateLocationString() !== location.location
  );

  const handleSubmit = async () => {
    if (!location || !isFormValid || isSubmitting || !hasChanges) return;

    setIsSubmitting(true);
    
    try {
      // Check if new location ID already exists (if changed)
      if (locationId !== location.id) {
        const idExists = await checkLocationIdExists(locationId.trim());
        if (idExists) {
          toast({
            title: "Error",
            description: `Location ID "${locationId}" already exists. Please choose a different ID.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const updates: Partial<PalletLocation> = {
        id: locationId,
        location: generateLocationString()
      };

      await onUpdateLocation(location.id, updates);
      
      toast({
        title: "Location Updated",
        description: `Location has been updated successfully`,
      });
      
      handleClose(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Edit className="h-5 w-5 mr-2 text-neutral-400" />
            Edit Location {location.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Validation Alert */}
          {!isFormValid && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <strong>Missing required fields:</strong> {missingFields.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Products */}
          {location.products.length > 0 && (
            <div className="bg-neutral-800/30 p-4 rounded-md border border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-300">Current Products</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {location.products.map(product => (
                  <div key={product.sku} className="text-sm text-neutral-400">
                    {product.name} (Qty: {product.qty})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Identification */}
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-semibold text-neutral-300">Location Identification</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-locationId" className="flex items-center gap-1 text-neutral-300">
                  Location ID *
                  {!locationId && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Input 
                  id="edit-locationId" 
                  placeholder="LOC-001" 
                  value={locationId} 
                  onChange={(e) => setLocationId(e.target.value)}
                  className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-neutral-600/50 focus:ring-1 focus:ring-neutral-500/30 ${!locationId ? "border-red-500/50" : ""}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-locationType" className="flex items-center gap-1 text-neutral-300">
                  Location Type *
                  {!locationType && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger className={`bg-neutral-800/50 border-neutral-700 text-white ${!locationType ? "border-red-500/50" : ""}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="pallet" className="hover:bg-neutral-800 focus:bg-neutral-800">Pallet Location</SelectItem>
                    <SelectItem value="shelf" className="hover:bg-neutral-800 focus:bg-neutral-800">Shelf Location</SelectItem>
                    <SelectItem value="bin" className="hover:bg-neutral-800 focus:bg-neutral-800">Bin Location</SelectItem>
                    <SelectItem value="floor" className="hover:bg-neutral-800 focus:bg-neutral-800">Floor Location</SelectItem>
                    <SelectItem value="rack" className="hover:bg-neutral-800 focus:bg-neutral-800">Rack Location</SelectItem>
                    <SelectItem value="cooler" className="hover:bg-neutral-800 focus:bg-neutral-800">Cooler Location</SelectItem>
                    <SelectItem value="freezer" className="hover:bg-neutral-800 focus:bg-neutral-800">Freezer Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-semibold text-neutral-300">Location Coordinates</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-zone" className="flex items-center gap-1 text-neutral-300">
                  Zone *
                  {!zone && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className={`bg-neutral-800/50 border-neutral-700 text-white ${!zone ? "border-red-500/50" : ""}`}>
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="A" className="hover:bg-neutral-800 focus:bg-neutral-800">Zone A</SelectItem>
                    <SelectItem value="B" className="hover:bg-neutral-800 focus:bg-neutral-800">Zone B</SelectItem>
                    <SelectItem value="C" className="hover:bg-neutral-800 focus:bg-neutral-800">Zone C</SelectItem>
                    <SelectItem value="D" className="hover:bg-neutral-800 focus:bg-neutral-800">Zone D</SelectItem>
                    <SelectItem value="PICK" className="hover:bg-neutral-800 focus:bg-neutral-800">Pick Zone</SelectItem>
                    <SelectItem value="RECV" className="hover:bg-neutral-800 focus:bg-neutral-800">Receiving</SelectItem>
                    <SelectItem value="SHIP" className="hover:bg-neutral-800 focus:bg-neutral-800">Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-aisle" className="flex items-center gap-1 text-neutral-300">
                  Aisle *
                  {!aisle && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Input 
                  id="edit-aisle" 
                  placeholder="01" 
                  value={aisle} 
                  onChange={(e) => setAisle(e.target.value)}
                  className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-neutral-600/50 focus:ring-1 focus:ring-neutral-500/30 ${!aisle ? "border-red-500/50" : ""}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-section" className="flex items-center gap-1 text-neutral-300">
                  Section *
                  {!section && <AlertCircle className="h-3 w-3 text-red-400" />}
                </Label>
                <Input 
                  id="edit-section" 
                  placeholder="A" 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-neutral-600/50 focus:ring-1 focus:ring-neutral-500/30 ${!section ? "border-red-500/50" : ""}`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-shelf" className="text-neutral-300">Shelf/Level</Label>
                <Input 
                  id="edit-shelf" 
                  placeholder="01" 
                  value={shelf} 
                  onChange={(e) => setShelf(e.target.value)}
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-neutral-600/50 focus:ring-1 focus:ring-neutral-500/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-bin" className="text-neutral-300">Bin/Position</Label>
                <Input 
                  id="edit-bin" 
                  placeholder="01" 
                  value={bin} 
                  onChange={(e) => setBin(e.target.value)}
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-neutral-600/50 focus:ring-1 focus:ring-neutral-500/30"
                />
              </div>
            </div>
            
            {/* Generated Location Preview */}
            {generateLocationString() && (
              <div className="bg-neutral-800/50 p-3 rounded-md border border-neutral-700">
                <Label className="text-sm font-medium text-neutral-300">Updated Location Code:</Label>
                <div className="text-lg font-mono font-bold text-neutral-300 mt-1">
                  {generateLocationString()}
                </div>
                {generateLocationString() !== location.location && (
                  <div className="text-sm text-amber-400 mt-1">
                    Changed from: {location.location}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Properties */}
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-semibold text-neutral-300">Location Properties</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity" className="text-neutral-300">Capacity (cubic ft)</Label>
                <Input 
                  id="edit-capacity" 
                  type="number"
                  placeholder="100" 
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)}
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-neutral-600/50 focus:ring-1 focus:ring-neutral-500/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-temperature" className="text-neutral-300">Temperature (°F)</Label>
                <Select value={temperature} onValueChange={setTemperature}>
                  <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                    <SelectValue placeholder="Select temp" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="ambient" className="hover:bg-neutral-800 focus:bg-neutral-800">Ambient (65-75°F)</SelectItem>
                    <SelectItem value="cool" className="hover:bg-neutral-800 focus:bg-neutral-800">Cool (45-65°F)</SelectItem>
                    <SelectItem value="cold" className="hover:bg-neutral-800 focus:bg-neutral-800">Cold (32-45°F)</SelectItem>
                    <SelectItem value="frozen" className="hover:bg-neutral-800 focus:bg-neutral-800">Frozen (0-32°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleClose(false)}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting || !hasChanges}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? "Updating..." : "Update Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditLocationDialog;