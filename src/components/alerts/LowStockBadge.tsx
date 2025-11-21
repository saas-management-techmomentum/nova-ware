
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface LowStockBadgeProps {
  stock: number;
}

const LowStockBadge = ({ stock }: LowStockBadgeProps) => {
  return (
    <Badge 
      className={`
        ${stock === 0 ? 'bg-rose-500/90' : 
          stock <= 5 ? 'bg-amber-500/90' : 
          'bg-indigo-500/90'}
        shadow-sm
      `}
    >
      {stock} units
    </Badge>
  );
};

export default LowStockBadge;
