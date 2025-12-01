import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Home, HelpCircle, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import WarehouseSelector from "@/components/warehouse/WarehouseSelector";
import { useOnboarding } from "@/contexts/OnboardingContext";
import ApprovalStatusIndicator from "@/components/user/ApprovalStatusIndicator";

const AppHeader = () => {
  const [companyName] = useState("LogistiX");
  const { user, employee, signOut } = useAuth(); // Add employee from context
  const navigate = useNavigate();
  const { isOnboardingEnabled, toggleOnboarding, startOnboarding, isLoading: onboardingLoading } = useOnboarding();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";

    // Check for employee data first
    if (employee?.name) {
      const names = employee.name.split(" ");
      return names.length >= 2 ? names[0][0] + names[names.length - 1][0] : names[0][0] || "U";
    }

    // Check for employee_name in user metadata
    const employeeName = user.user_metadata?.["employee_name"];
    if (employeeName) {
      const names = employeeName.split(" ");
      return names.length >= 2 ? names[0][0] + names[names.length - 1][0] : names[0][0] || "U";
    }

    // Fall back to first_name and last_name
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    return (firstName[0] || "") + (lastName[0] || "") || "U";
  };

  const getUserName = () => {
    if (!user) return "User";

    // Check for employee data first (from database)
    if (employee?.name && employee.name.trim()) {
      return employee.name.trim();
    }

    // Check for employee_name in user metadata (fallback)
    const employeeName = user.user_metadata?.["employee_name"];
    if (employeeName && employeeName.trim()) {
      return employeeName.trim();
    }

    // Fall back to first_name and last_name combination
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    return fullName || "User";
  };

  const handleOnboardingToggle = async () => {
    await toggleOnboarding();
  };

  const handleStartOnboarding = () => {
    startOnboarding();
  };

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm z-20">
      <div className="h-full px-6">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">{companyName}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Warehouse Selector */}
            <div data-onboarding="warehouse-selector">
              <WarehouseSelector />
            </div>

            {/* Back to Landing Page */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:text-white"
            >
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-neutral-700 bg-neutral-800/50"
                >
                  <Bell className="h-5 w-5 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="py-2 px-4">
                  <h3 className="font-medium text-sm">Notifications</h3>
                </div>
                <DropdownMenuSeparator />

                {/* Approval Status Indicator */}
                <div className="px-4 py-2">
                  <ApprovalStatusIndicator />
                </div>

                <div className="py-6 text-center text-sm text-muted-foreground">No new notifications</div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 rounded-full border border-neutral-700 bg-neutral-800/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-neutral-700 text-neutral-100 text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm text-white hidden sm:block">{getUserName()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="py-2 px-4">
                  <p className="text-sm font-medium">{getUserName()}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                {/* Onboarding Toggle */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Onboarding</span>
                    </div>
                    <Switch
                      checked={isOnboardingEnabled}
                      onCheckedChange={handleOnboardingToggle}
                      disabled={onboardingLoading}
                      className="scale-75"
                    />
                  </div>
                </div>

                {/* Start Onboarding Option */}
                {isOnboardingEnabled && (
                  <DropdownMenuItem onClick={handleStartOnboarding} className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Start Tour</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
