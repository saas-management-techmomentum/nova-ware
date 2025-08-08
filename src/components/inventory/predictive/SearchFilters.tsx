
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchFiltersProps {
  searchTerm: string;
  timeFilter: string;
  monthFilter: string;
  weekFilter: string;
  sortBy: string;
  setSearchTerm: (value: string) => void;
  setTimeFilter: (value: string) => void;
  setMonthFilter: (value: string) => void;
  setWeekFilter: (value: string) => void;
  setSortBy: (value: string) => void;
}

const SearchFilters = ({
  searchTerm,
  timeFilter,
  monthFilter,
  weekFilter,
  sortBy,
  setSearchTerm,
  setTimeFilter,
  setMonthFilter,
  setWeekFilter,
  setSortBy,
}: SearchFiltersProps) => {
  return (
    <div className="p-4 bg-slate-800/70 border-b border-slate-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by product, SKU..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Filter by time" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="critical">Critical levels</SelectItem>
              <SelectItem value="warning">Replenishment due</SelectItem>
              <SelectItem value="7days">Next 7 days</SelectItem>
              <SelectItem value="14days">Next 14 days</SelectItem>
              <SelectItem value="30days">Next 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="january">January</SelectItem>
              <SelectItem value="february">February</SelectItem>
              <SelectItem value="march">March</SelectItem>
              <SelectItem value="april">April</SelectItem>
              <SelectItem value="may">May</SelectItem>
              <SelectItem value="june">June</SelectItem>
              <SelectItem value="july">July</SelectItem>
              <SelectItem value="august">August</SelectItem>
              <SelectItem value="september">September</SelectItem>
              <SelectItem value="october">October</SelectItem>
              <SelectItem value="november">November</SelectItem>
              <SelectItem value="december">December</SelectItem>
            </SelectContent>
          </Select>

          <Select value={weekFilter} onValueChange={setWeekFilter}>
            <SelectTrigger className="w-[140px] bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Week" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Weeks</SelectItem>
              <SelectItem value="week1">Week 1-4</SelectItem>
              <SelectItem value="week5">Week 5-8</SelectItem>
              <SelectItem value="week9">Week 9-12</SelectItem>
              <SelectItem value="week13">Week 13-16</SelectItem>
              <SelectItem value="week17">Week 17-20</SelectItem>
              <SelectItem value="week21">Week 21-24</SelectItem>
              <SelectItem value="week25">Week 25-28</SelectItem>
              <SelectItem value="week29">Week 29-32</SelectItem>
              <SelectItem value="week33">Week 33-36</SelectItem>
              <SelectItem value="week37">Week 37-40</SelectItem>
              <SelectItem value="week41">Week 41-44</SelectItem>
              <SelectItem value="week45">Week 45-48</SelectItem>
              <SelectItem value="week49">Week 49-52</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="urgency">Priority (Default)</SelectItem>
              <SelectItem value="name">Product Name</SelectItem>
              <SelectItem value="stock">Current Stock</SelectItem>
              <SelectItem value="usage">Distribution Rate</SelectItem>
              <SelectItem value="confidence">Forecast Accuracy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
