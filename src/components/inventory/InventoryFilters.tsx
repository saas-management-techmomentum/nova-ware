
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface FiltersType {
  lowStock: boolean;
  expiringSoon: boolean;
  noLocation: boolean;
}

interface InventoryFiltersProps {
  filters: FiltersType;
  onFilterChange: (key: keyof FiltersType) => void;
}

const InventoryFilters = ({ filters, onFilterChange }: InventoryFiltersProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm" 
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 theme-dropdown">
        <DropdownMenuLabel className="theme-text-secondary">Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator className="theme-border" />
        <DropdownMenuCheckboxItem
          checked={filters.lowStock}
          onCheckedChange={() => onFilterChange('lowStock')}
          className="theme-text-primary"
        >
          Low Stock Items
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.expiringSoon}
          onCheckedChange={() => onFilterChange('expiringSoon')}
          className="theme-text-primary"
        >
          Expiring Soon
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.noLocation}
          onCheckedChange={() => onFilterChange('noLocation')}
          className="theme-text-primary"
        >
          No Location Assigned
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InventoryFilters;
