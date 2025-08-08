
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: string;
  toggleSortOrder: () => void;
}

const SearchFilter = ({ searchTerm, setSearchTerm, sortOrder, toggleSortOrder }: SearchFilterProps) => {
  return (
    <div className="p-4 bg-slate-800/70 border-b border-slate-700">
      <div className="flex space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by product name or UPC..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="secondary"
          size="sm" 
          className="gap-2" 
          onClick={toggleSortOrder}
        >
          <Filter className="h-4 w-4" />
          {sortOrder === 'stock' ? 'By Stock Level' : 'By Restock Date'}
        </Button>
      </div>
    </div>
  );
};

export default SearchFilter;
