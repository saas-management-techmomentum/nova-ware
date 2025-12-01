import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Home } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import WarehouseSelector from "@/components/warehouse/WarehouseSelector";

const Header = () => {
  const { toast } = useToast();
  return (
    <header className="h-16 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-3">
      <SidebarTrigger className="" />
      <div className="flex-1 max-w-xl">
        <Input placeholder="Search products, orders, shipments..." />
      </div>
      <Link to="/app">
        <Button variant="ghost" size="icon" aria-label="Home">
          <Home className="h-5 w-5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          toast({ title: "Notifications", description: "You're all caught up!" })
        }
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </Button>
      <WarehouseSelector />
      <Avatar>
        <AvatarFallback>WM</AvatarFallback>
      </Avatar>
    </header>
  );
};

export default Header;
