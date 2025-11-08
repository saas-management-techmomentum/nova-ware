
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductSalesData {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  currentStock: number;
}

interface BestWorstSellersProps {
  bestSellers: ProductSalesData[];
  worstSellers: ProductSalesData[];
}

const BestWorstSellers: React.FC<BestWorstSellersProps> = ({ bestSellers, worstSellers }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Best Sellers */}
      <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 shadow-md">
        <CardHeader className="pb-3 border-b border-neutral-800">
          <CardTitle className="text-lg flex items-center text-white">
            <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
            Best Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {bestSellers.length > 0 ? (
            <div className="space-y-3">
              {bestSellers.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{item.name}</p>
                      <p className="text-xs text-neutral-400">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 mb-1">
                      {item.totalSold} sold
                    </Badge>
                    <p className="text-xs text-neutral-400">{item.currentStock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worst Sellers */}
      <Card className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 shadow-md">
        <CardHeader className="pb-3 border-b border-neutral-800">
          <CardTitle className="text-lg flex items-center text-white">
            <TrendingDown className="h-5 w-5 mr-2 text-red-400" />
            Slow Moving Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {worstSellers.length > 0 ? (
            <div className="space-y-3">
              {worstSellers.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{item.name}</p>
                      <p className="text-xs text-neutral-400">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 mb-1">
                      {item.totalSold} sold
                    </Badge>
                    <p className="text-xs text-neutral-400">{item.currentStock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BestWorstSellers;
