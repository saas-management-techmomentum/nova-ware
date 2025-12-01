
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
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
      return isUserAdmin ? <Globe className="h-4 w-4 text-neutral-400" /> : <Building2 className="h-4 w-4 text-emerald-400" />;
    }
    return <Building2 className="h-4 w-4 text-emerald-400" />;
  };

  const handleWarehouseAdded = async () => {
    await refreshWarehouses();
  };

  // Show the dropdown if user is admin or has multiple warehouse access
  const shouldShowDropdown = isUserAdmin || warehouses.length > 1;

  return (
    <Sidebar>
      <div className="h-16 flex items-center px-5 border-b border-neutral-800 bg-neutral-950 backdrop-blur-sm">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <span className="text-xl font-semibold text-white"></span>
        </Link>
        <SidebarTrigger className="ml-auto lg:hidden text-neutral-300 hover:text-white transition-colors" />
      </div>
      <SidebarContent className="bg-neutral-950 h-full overflow-hidden">
        {shouldShowDropdown && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 mb-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2 rounded-md bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-colors">
                      <div className="flex items-center gap-2">
                        {getSelectionIcon()}
                        <span className="text-sm font-medium">{getCurrentSelectionText()}</span>
                        {isUserAdmin && !selectedWarehouse && (
                          <Shield className="h-3 w-3 text-neutral-400" />
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-64 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 text-neutral-300 z-50"
                  >
                    {isUserAdmin && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleWarehouseChange(null)}
                          className="flex items-center gap-2 hover:bg-neutral-700/50 focus:bg-neutral-700/50"
                        >
                          <Globe className="h-4 w-4 text-neutral-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">Corporate Overview</span>
                            <span className="text-xs text-neutral-400">All warehouses & data</span>
                          </div>
                          {!selectedWarehouse && <Activity className="h-3 w-3 ml-auto text-emerald-400" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-700/50" />
                      </>
                    )}
                    
                    {!isUserAdmin && warehouses.length > 1 && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleWarehouseChange(null)}
                          className="flex items-center gap-2 hover:bg-neutral-700/50 focus:bg-neutral-700/50"
                        >
                          <Building2 className="h-4 w-4 text-emerald-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">All Locations</span>
                            <span className="text-xs text-neutral-400">Combined view</span>
                          </div>
                          {!selectedWarehouse && <Activity className="h-3 w-3 ml-auto text-emerald-400" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-700/50" />
                      </>
                    )}
                    
                    {warehouses.map((warehouse) => {
                      const assignment = warehouseAssignments.find(w => w.warehouse_id === warehouse.warehouse_id);
                      return (
                        <DropdownMenuItem 
                          key={warehouse.warehouse_id}
                          onClick={() => handleWarehouseChange(warehouse.warehouse_id)}
                          className="flex items-center gap-2 hover:bg-neutral-700/50 focus:bg-neutral-700/50"
                        >
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{warehouse.warehouse_code}</span>
                              {assignment?.role === 'manager' && (
                                <Shield className="h-3 w-3 text-amber-400" />
                              )}
                            </div>
                            <span className="text-xs text-neutral-400">{warehouse.warehouse_name}</span>
                          </div>
                          {selectedWarehouse === warehouse.warehouse_id && (
                            <Activity className="h-3 w-3 ml-auto text-emerald-400" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    
                    {isUserAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-neutral-700/50" />
                        <div className="p-2">
                          <AddWarehouseDialog onWarehouseAdded={handleWarehouseAdded} />
                        </div>
                      </>
                    )}
                    
                    {warehouses.length === 0 && (
                      <DropdownMenuItem disabled className="text-neutral-500 text-xs">
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
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-medium text-neutral-400">
            {selectedWarehouse ? 
              warehouses.find(w => w.warehouse_id === selectedWarehouse)?.warehouse_code || 'Warehouse' : 
              (isUserAdmin ? 'Corporate' : 'Menu')
            }
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="grid grid-cols-1 gap-2 px-3">
              {permissionsLoading ? (
                <div className="col-span-1 flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  <span className="ml-2 text-sm text-neutral-400">Loading permissions...</span>
                </div>
              ) : (
                menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Link 
                      to={item.path}
                      className="flex flex-col items-start gap-1.5 p-2 transition-all duration-200"
                    >
                      <div className={`p-2.5 rounded-lg border transition-all ${
                        location.pathname === item.path 
                          ? 'bg-neutral-800 border-neutral-600 shadow-md' 
                          : 'border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800/50'
                      }`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] leading-tight ${
                        location.pathname === item.path 
                          ? 'text-white font-medium' 
                          : 'text-neutral-400'
                      }`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-300 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span>System Status</span>
              <span className="flex items-center gap-1">
                <Circle className={`h-2 w-2 fill-current ${getSystemStatusColor()}`} />
                <span className={getSystemStatusColor()}>{getSystemStatusText()}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Update</span>
              <span>{getMinutesAgo()} min ago</span>
            </div>
          </div>
        </div> */}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
