import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Package,
  ClipboardList,
  MapPin,
  LayoutDashboard,
  ListTodo,
  Users,
  TrendingDown,
  Truck,
  Settings,
  DollarSign,
  Building2,
} from "lucide-react";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
const AppSidebar = () => {
  const location = useLocation();
  const { warehouses, selectedWarehouse, isUserAdmin } = useWarehouse();
  const { getFilteredMenuItems } = usePagePermissions();

  // Define all menu items
  const allMenuItems = [
    {
      title: "Dashboard",
      path: "/app",
      icon: LayoutDashboard,
    },
    {
      title: "Inventory",
      path: "/app/inventory",
      icon: Package,
    },
    {
      title: "Predictive Inventory",
      path: "/app/predictive-inventory",
      icon: TrendingDown,
    },
    {
      title: "Shipments",
      path: "/app/shipments",
      icon: Truck,
    },
    {
      title: "Orders",
      path: "/app/orders",
      icon: ClipboardList,
    },
    {
      title: "Locations",
      path: "/app/locations",
      icon: MapPin,
    },
    {
      title: "Employees",
      path: "/app/todos",
      icon: ListTodo,
    },
    {
      title: "Financial Management",
      path: "/app/financial",
      icon: DollarSign,
    },
    {
      title: "Integrations",
      path: "/app/integrations",
      icon: Settings,
    },
    {
      title: "Clients",
      path: "/app/clients",
      icon: Users,
    },
    {
      title: "Vendors",
      path: "/app/vendors",
      icon: Building2,
    },
  ];

  // Core menu items for Corporate Overview / All Warehouses view
  const coreMenuItems = [
    {
      title: "Dashboard",
      path: "/app",
      icon: LayoutDashboard,
    },
    {
      title: "Inventory",
      path: "/app/inventory",
      icon: Package,
    },
    {
      title: "Employees",
      path: "/app/todos",
      icon: ListTodo,
    },
    {
      title: "Financial Management",
      path: "/app/financial",
      icon: DollarSign,
    },
    {
      title: "Clients",
      path: "/app/clients",
      icon: Users,
    },
    {
      title: "Vendors",
      path: "/app/vendors",
      icon: Building2,
    },
  ];

  // Filter menu items based on warehouse selection and page permissions
  const baseMenuItems = selectedWarehouse ? allMenuItems : coreMenuItems;
  const menuItems = getFilteredMenuItems(baseMenuItems);
  return (
    <Sidebar className="w-24">
      <SidebarContent className="bg-neutral-950 h-full overflow-hidden">
        {/* LogistiX Title */}
        <div className="items-center justify-center border-b mx-0 my-0 py-[15px] border-transparent flex flex-row pb-[7px]">
          <h1 className="text-lg font-semibold text-white">LogistiX</h1>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link to={item.path} className="flex flex-col items-center gap-1 p-2 transition-all duration-200">
                    <div
                      className={`p-2 rounded-lg border transition-all ${location.pathname === item.path ? "bg-neutral-800 border-neutral-600 shadow-md" : "border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800/50"}`}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[9px] leading-tight text-center ${location.pathname === item.path ? "text-white font-medium" : "text-neutral-400"}`}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
export default AppSidebar;
