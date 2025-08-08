import React from 'react';
import { ShoppingCart, DollarSign, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';

interface PurchaseOrderDashboardProps {
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseOrderDashboard: React.FC<PurchaseOrderDashboardProps> = ({ purchaseOrders }) => {
  // Calculate metrics
  const openPOs = purchaseOrders.filter(po => ['draft', 'approved'].includes(po.status));
  const totalOpenValue = openPOs.reduce((sum, po) => sum + po.total_amount, 0);
  const pendingApprovals = purchaseOrders.filter(po => po.status === 'draft').length;
  const receivedThisMonth = purchaseOrders.filter(po => {
    const receivedDate = new Date(po.updated_at);
    const thisMonth = new Date();
    return po.status === 'received' && 
           receivedDate.getMonth() === thisMonth.getMonth() && 
           receivedDate.getFullYear() === thisMonth.getFullYear();
  }).length;
  
  const latePOs = purchaseOrders.filter(po => {
    if (!po.expected_delivery_date || po.status === 'received') return false;
    return new Date(po.expected_delivery_date) < new Date();
  }).length;

  const metrics = [
    {
      title: 'Active Orders',
      value: openPOs.length,
      icon: ShoppingCart,
      iconClass: 'metric-icon-primary',
      trend: '+12%',
      description: 'Currently processing'
    },
    {
      title: 'Total Value',
      value: `$${totalOpenValue.toLocaleString()}`,
      icon: DollarSign,
      iconClass: 'metric-icon-success',
      trend: '+8.2%',
      description: 'Open order value'
    },
    {
      title: 'Pending Approval',
      value: pendingApprovals,
      icon: Clock,
      iconClass: 'metric-icon-warning',
      trend: pendingApprovals > 0 ? 'animate-pulse-glow' : '',
      description: 'Requires attention'
    },
    {
      title: 'Completed',
      value: receivedThisMonth,
      icon: CheckCircle,
      iconClass: 'metric-icon-success',
      trend: '+15%',
      description: 'This month'
    },
    {
      title: 'Overdue',
      value: latePOs,
      icon: AlertTriangle,
      iconClass: 'metric-icon-danger',
      trend: latePOs > 0 ? 'animate-pulse-glow' : '',
      description: 'Past delivery date'
    }
  ];

  return (
    <div className="p-8 relative">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div 
              key={index}
              className={`glass-metric-card p-6 rounded-2xl group animate-fade-in ${metric.trend.includes('animate') ? metric.trend : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="metric-label mb-1">
                    {metric.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="metric-value text-3xl">
                      {metric.value}
                    </span>
                    {metric.trend && !metric.trend.includes('animate') && (
                      <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {metric.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="metric-description">
                  {metric.description}
                </p>
                <div className={`p-3 rounded-xl ${metric.iconClass} transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5 text-white icon-glow" />
                </div>
              </div>

              {/* Subtle bottom border glow */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          );
        })}
      </div>
    </div>
  );
};