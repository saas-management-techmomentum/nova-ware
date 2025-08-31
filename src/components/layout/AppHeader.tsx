
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, User, LogOut, Home, HelpCircle, Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import WarehouseSelector from '@/components/warehouse/WarehouseSelector';
import { useOnboarding } from '@/contexts/OnboardingContext';
import ApprovalStatusIndicator from '@/components/user/ApprovalStatusIndicator';

const AppHeader = () => {
  const [companyName] = useState("LogistiX");
  const { user, employee, signOut } = useAuth(); // Add employee from context
  const navigate = useNavigate();
  const { 
    isOnboardingEnabled, 
    toggleOnboarding, 
    startOnboarding, 
    isLoading: onboardingLoading 
  } = useOnboarding();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Check for employee data first
    if (employee?.name) {
      const names = employee.name.split(' ');
      return names.length >= 2 ? names[0][0] + names[names.length - 1][0] : names[0][0] || 'U';
    }
    
    // Check for employee_name in user metadata
    const employeeName = user.user_metadata?.['employee_name'];
    if (employeeName) {
      const names = employeeName.split(' ');
      return names.length >= 2 ? names[0][0] + names[names.length - 1][0] : names[0][0] || 'U';
    }
    
    // Fall back to first_name and last_name
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    return (firstName[0] || '') + (lastName[0] || '') || 'U';
  };

  const getUserName = () => {
    if (!user) return 'User';
    
    // Check for employee data first (from database)
    if (employee?.name && employee.name.trim()) {
      return employee.name.trim();
    }
    
    // Check for employee_name in user metadata (fallback)
    const employeeName = user.user_metadata?.['employee_name'];
    if (employeeName && employeeName.trim()) {
      return employeeName.trim();
    }
    
    // Fall back to first_name and last_name combination
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    
    return fullName || 'User';
  };

  const handleOnboardingToggle = async () => {
    await toggleOnboarding();
  };

  const handleStartOnboarding = () => {
    startOnboarding();
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-6">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" />
            
            <h1 className="text-lg font-roboto font-bold text-foreground">
              {companyName}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div data-onboarding="warehouse-selector">
              <WarehouseSelector />
            </div>
            
            <Button 
              asChild
              variant="ghost" 
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-80 bg-popover border border-border">
                <div className="py-2 px-4">
                  <h3 className="font-medium text-sm text-popover-foreground">Notifications</h3>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                
                <div className="px-4 py-2">
                  <ApprovalStatusIndicator />
                </div>
                
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-roboto font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm text-foreground hidden sm:block font-roboto">
                    {getUserName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border">
                <div className="py-2 px-4">
                  <p className="text-sm font-medium text-popover-foreground">{getUserName()}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="hover:bg-accent">
                  <Link to="/app/profile" className="cursor-pointer text-popover-foreground">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                
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
                
                {isOnboardingEnabled && (
                  <DropdownMenuItem onClick={handleStartOnboarding} className="cursor-pointer hover:bg-accent text-popover-foreground">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Start Tour</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:bg-destructive/10 focus:text-destructive">
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
