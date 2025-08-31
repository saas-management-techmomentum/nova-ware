
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Package, 
  ClipboardList, 
  MapPin, 
  LayoutDashboard,
  AlertTriangle,
  Box,
  ListTodo,
  BarChart,
  Users,
  TrendingDown,
  Truck,
  Settings,
  DollarSign,
  Building2,
  ChevronDown,
  Activity,
  Shield,
  Globe,
  Circle,
  Loader2
} from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import AddWarehouseDialog from '@/components/warehouse/AddWarehouseDialog';

const AppSidebar = () => {
  const location = useLocation();
  const { warehouses, selectedWarehouse, setSelectedWarehouse, canViewAllWarehouses, refreshWarehouses, isUserAdmin } = useWarehouse();
  const { warehouseAssignments } = useUserPermissions();
  const { getFilteredMenuItems, isLoading: permissionsLoading } = usePagePermissions();
  
  // System status state
  const [systemStatus] = useState<'operational' | 'warning' | 'error'>('operational');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // Update last update time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would be updated when actual system updates occur
      // For now, we'll just update it every few minutes to simulate activity
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdateTime.getTime();
      if (timeDiff > 5 * 60 * 1000) { // Update every 5 minutes
        setLastUpdateTime(new Date());
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  const getMinutesAgo = () => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const getSystemStatusColor = () => {
    switch (systemStatus) {
      case 'operational':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-emerald-400';
    }
  };

  const getSystemStatusText = () => {
    switch (systemStatus) {
      case 'operational':
        return 'Operational';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Operational';
    }
  };
  
  // Debug logging
  console.log('AppSidebar Debug:', {
    warehouses,
    selectedWarehouse,
    canViewAllWarehouses,
    isUserAdmin,
    warehousesLength: warehouses.length,
    warehouseAssignments,
    permissionsLoading
  });
  
  // Define all menu items
  const allMenuItems = [
    {
      title: 'Dashboard',
      path: '/app',
      icon: LayoutDashboard
    },
    {
      title: 'Inventory',
      path: '/app/inventory',
      icon: Package
    },
    {
      title: 'Predictive Inventory',
      path: '/app/predictive-inventory',
      icon: TrendingDown
    },
    {
      title: 'Shipments',
      path: '/app/shipments',
      icon: Truck
    },
    {
      title: 'Order Management',
      path: '/app/orders',
      icon: ClipboardList
    },
    {
      title: 'Product Locations',
      path: '/app/locations',
      icon: MapPin
    },
    {
      title: 'Employee Management',
      path: '/app/todos',
      icon: ListTodo
    },
    {
      title: 'Financial Management',
      path: '/app/financial',
      icon: DollarSign
    },
    {
      title: 'Integrations',
      path: '/app/integrations',
      icon: Settings
    },
    {
      title: 'Client Database',
      path: '/app/clients',
      icon: Users
    },
    {
      title: 'Vendor Database',
      path: '/app/vendors',
      icon: Building2
    }
  ];

  // Core menu items for Corporate Overview / All Warehouses view
  const coreMenuItems = [
    {
      title: 'Dashboard',
      path: '/app',
      icon: LayoutDashboard
    },
    {
      title: 'Inventory',
      path: '/app/inventory',
      icon: Package
    },
    {
      title: 'Employee Management',
      path: '/app/todos',
      icon: ListTodo
    },
    {
      title: 'Financial Management',
      path: '/app/financial',
      icon: DollarSign
    },
    {
      title: 'Client Database',
      path: '/app/clients',
      icon: Users
    },
    {
      title: 'Vendor Database',
      path: '/app/vendors',
      icon: Building2
    }
  ];

  // Filter menu items based on warehouse selection and page permissions
  const baseMenuItems = selectedWarehouse ? allMenuItems : coreMenuItems;
  const menuItems = getFilteredMenuItems(baseMenuItems);
  
  const handleWarehouseChange = (warehouseId: string | null) => {
    console.log('Changing warehouse to:', warehouseId);
    setSelectedWarehouse(warehouseId);
  };

  const getCurrentSelectionText = () => {
    if (!selectedWarehouse) {
      return isUserAdmin ? 'Corporate Overview' : 'All Locations';
    }
    const warehouse = warehouses.find(w => w.warehouse_id === selectedWarehouse);
    return warehouse ? `${warehouse.warehouse_code}` : 'Select Warehouse';
  };

  const getSelectionIcon = () => {
    if (!selectedWarehouse) {
      return isUserAdmin ? <Globe className="h-4 w-4 text-indigo-400" /> : <Building2 className="h-4 w-4 text-emerald-400" />;
    }
    return <Building2 className="h-4 w-4 text-emerald-400" />;
  };

  const handleWarehouseAdded = async () => {
    console.log('Warehouse added, refreshing list');
    await refreshWarehouses();
  };

  // Show the dropdown if user is admin or has multiple warehouse access
  const shouldShowDropdown = isUserAdmin || warehouses.length > 1;

  return (
    <Sidebar>
      <div className="h-16 flex items-center px-5 border-b border-logistix-orange/20 bg-gradient-to-r from-logistix-dark-gray to-slate-900 backdrop-blur-sm relative">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-logistix-orange via-logistix-blue to-logistix-green"></div>
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <span className="text-xl font-roboto font-bold text-gradient-animate">LogistiX</span>
        </Link>
        <SidebarTrigger className="ml-auto lg:hidden text-slate-300 hover:text-logistix-orange transition-colors" />
      </div>
      <SidebarContent className="bg-gradient-to-b from-logistix-dark-gray to-slate-900 h-full border-r border-logistix-orange/20 relative">
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-logistix-orange/50 via-transparent to-logistix-blue/50"></div>
        {shouldShowDropdown && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 mb-2">
                <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <button className="w-full flex items-center justify-between p-2 rounded-md glass-metric-card hover:bg-logistix-orange/10 text-slate-300 hover:text-white transition-all duration-200 group">
                       <div className="flex items-center gap-2">
                         {getSelectionIcon()}
                         <span className="text-sm font-roboto font-medium">{getCurrentSelectionText()}</span>
                         {isUserAdmin && !selectedWarehouse && (
                           <Shield className="h-3 w-3 text-logistix-blue" />
                         )}
                       </div>
                       <ChevronDown className="h-4 w-4 group-hover:text-logistix-orange transition-colors" />
                     </button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent 
                     align="start" 
                     className="w-64 glass-card-enhanced text-slate-300 z-50"
                   >
                    {isUserAdmin && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleWarehouseChange(null)}
                          className="flex items-center gap-2 hover:bg-slate-700/50 focus:bg-slate-700/50"
                        >
                          <Globe className="h-4 w-4 text-indigo-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">Corporate Overview</span>
                            <span className="text-xs text-slate-400">All warehouses & data</span>
                          </div>
                          {!selectedWarehouse && <Activity className="h-3 w-3 ml-auto text-emerald-400" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700/50" />
                      </>
                    )}
                    
                    {!isUserAdmin && warehouses.length > 1 && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleWarehouseChange(null)}
                          className="flex items-center gap-2 hover:bg-slate-700/50 focus:bg-slate-700/50"
                        >
                          <Building2 className="h-4 w-4 text-emerald-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">All Locations</span>
                            <span className="text-xs text-slate-400">Combined view</span>
                          </div>
                          {!selectedWarehouse && <Activity className="h-3 w-3 ml-auto text-emerald-400" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700/50" />
                      </>
                    )}
                    
                    {warehouses.map((warehouse) => {
                      const assignment = warehouseAssignments.find(w => w.warehouse_id === warehouse.warehouse_id);
                      return (
                        <DropdownMenuItem 
                          key={warehouse.warehouse_id}
                          onClick={() => handleWarehouseChange(warehouse.warehouse_id)}
                          className="flex items-center gap-2 hover:bg-slate-700/50 focus:bg-slate-700/50"
                        >
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{warehouse.warehouse_code}</span>
                              {assignment?.role === 'manager' && (
                                <Shield className="h-3 w-3 text-amber-400" />
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{warehouse.warehouse_name}</span>
                          </div>
                          {selectedWarehouse === warehouse.warehouse_id && (
                            <Activity className="h-3 w-3 ml-auto text-emerald-400" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    
                    {isUserAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-slate-700/50" />
                        <div className="p-2">
                          <AddWarehouseDialog onWarehouseAdded={handleWarehouseAdded} />
                        </div>
                      </>
                    )}
                    
                    {warehouses.length === 0 && (
                      <DropdownMenuItem disabled className="text-slate-500 text-xs">
                        No warehouses assigned
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-roboto font-medium text-gradient-animate">
            {selectedWarehouse ? 
              warehouses.find(w => w.warehouse_id === selectedWarehouse)?.warehouse_code || 'Warehouse' : 
              (isUserAdmin ? 'Corporate' : 'Menu')
            }
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-400">Loading permissions...</span>
                </div>
              ) : (
                menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <Link 
                         to={item.path}
                         className={`transition-all duration-300 relative ${
                           location.pathname === item.path 
                             ? 'bg-gradient-to-r from-logistix-orange/20 to-transparent text-white border-l-2 border-logistix-orange shadow-glow-primary backdrop-blur-sm'
                             : 'hover:bg-logistix-orange/5 border-l-2 border-transparent text-slate-300 hover:text-white hover:border-logistix-orange/50'
                         }`}
                       >
                         <item.icon className={`w-5 h-5 transition-all duration-200 ${
                           location.pathname === item.path ? 'text-logistix-orange icon-glow' : 'hover:text-logistix-blue'
                         }`} />
                         <span className="font-roboto">{item.title}</span>
                         
                         {location.pathname === item.path && (
                           <span className="ml-auto h-1.5 w-1.5 rounded-full bg-logistix-orange shadow-glow-warning animate-pulse-slow"></span>
                         )}
                       </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="glass-metric-card p-3 rounded-lg text-slate-300 text-xs font-roboto relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-logistix-orange to-transparent"></div>
            <div className="flex items-center justify-between mb-2">
              <span>System Status</span>
              <span className="flex items-center gap-1">
                <Circle className={`h-2 w-2 fill-current ${getSystemStatusColor()} animate-pulse`} />
                <span className={`${getSystemStatusColor()} font-medium`}>{getSystemStatusText()}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Update</span>
              <span className="text-logistix-blue font-medium">{getMinutesAgo()} min ago</span>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
