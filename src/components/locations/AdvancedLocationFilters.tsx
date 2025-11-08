
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, MapPin, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationFilters {
  searchTerm: string;
  zone: string;
  velocity: string;
  utilizationRange: [number, number];
  showEmpty: boolean;
  showOverstocked: boolean;
  category: string;
  lastMovedDays: number;
}

interface AdvancedLocationFiltersProps {
  filters: LocationFilters;
  onFiltersChange: (filters: LocationFilters) => void;
  className?: string;
}

const AdvancedLocationFilters: React.FC<AdvancedLocationFiltersProps> = ({
  filters,
  onFiltersChange,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof LocationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      zone: 'all',
      velocity: 'all',
      utilizationRange: [0, 100],
      showEmpty: false,
      showOverstocked: false,
      category: 'all',
      lastMovedDays: 30
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.zone && filters.zone !== 'all') count++;
    if (filters.velocity && filters.velocity !== 'all') count++;
    if (filters.utilizationRange[0] > 0 || filters.utilizationRange[1] < 100) count++;
    if (filters.showEmpty) count++;
    if (filters.showOverstocked) count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.lastMovedDays !== 30) count++;
    return count;
  };

  return (
    <Card className={cn("bg-slate-800/50 backdrop-blur-md border-slate-700/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center text-white">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="ml-2 bg-gray-800">{getActiveFilterCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-slate-400 hover:text-white text-xs"
            >
              Clear All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-slate-300">Search Locations</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by location, product, or UPC..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
              />
            </div>
          </div>

          {/* Zone and Velocity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Zone</Label>
              <Select value={filters.zone} onValueChange={(value) => updateFilter('zone', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="A">Zone A</SelectItem>
                  <SelectItem value="B">Zone B</SelectItem>
                  <SelectItem value="C">Zone C</SelectItem>
                  <SelectItem value="receiving">Receiving</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Velocity</Label>
              <Select value={filters.velocity} onValueChange={(value) => updateFilter('velocity', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="All Velocities" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Velocities</SelectItem>
                  <SelectItem value="high">High Velocity</SelectItem>
                  <SelectItem value="medium">Medium Velocity</SelectItem>
                  <SelectItem value="low">Low Velocity</SelectItem>
                  <SelectItem value="bulk">Bulk Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Utilization Range */}
          <div className="space-y-2">
            <Label className="text-slate-300">
              Utilization Rate: {filters.utilizationRange[0]}% - {filters.utilizationRange[1]}%
            </Label>
            <Slider
              value={filters.utilizationRange}
              onValueChange={(value) => updateFilter('utilizationRange', value as [number, number])}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Show Empty Locations</Label>
              <Switch
                checked={filters.showEmpty}
                onCheckedChange={(checked) => updateFilter('showEmpty', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Show Overstocked</Label>
              <Switch
                checked={filters.showOverstocked}
                onCheckedChange={(checked) => updateFilter('showOverstocked', checked)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-slate-300">Product Category</Label>
            <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Last Moved Filter */}
          <div className="space-y-2">
            <Label className="text-slate-300">
              Last Moved Within: {filters.lastMovedDays} days
            </Label>
            <Slider
              value={[filters.lastMovedDays]}
              onValueChange={(value) => updateFilter('lastMovedDays', value[0])}
              max={365}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedLocationFilters;
