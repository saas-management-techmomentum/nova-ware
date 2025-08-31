import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import UserManagement from "@/components/admin/UserManagement";
import { BellRing, Globe, Bell, Shield, Eye, Lock, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Settings = () => {
  const { toast } = useToast();
  const { isAdmin } = useUserPermissions();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [displayName, setDisplayName] = useState("John Doe");
  const [language, setLanguage] = useState("English (US)");

  const handleSaveGeneral = () => {
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Settings</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} mb-8`}>
          <TabsTrigger value="general">
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            Security
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="general">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <div className="relative">
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-background border-border w-full h-10 rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                  <Globe className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                </div>
                <ThemeToggle />
              </div>
              
              <Button onClick={handleSaveGeneral} className="mt-4">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                </div>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications for important alerts</p>
                </div>
                <Switch 
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Notification Types</Label>
                </div>
                
                <div className="grid gap-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="orderUpdates"
                      defaultChecked
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor="orderUpdates" className="text-sm font-normal">Order Updates</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="inventoryAlerts"
                      defaultChecked
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor="inventoryAlerts" className="text-sm font-normal">Inventory Alerts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="systemAnnouncements"
                      defaultChecked
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor="systemAnnouncements" className="text-sm font-normal">System Announcements</Label>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveNotifications} className="mt-4">
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <Label className="text-base">Password</Label>
                </div>
                
                <div className="grid gap-4 pt-2">
                  <Input
                    type="password"
                    placeholder="Current password"
                    className="bg-background border-border"
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    className="bg-background border-border"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-background border-border"
                  />
                </div>
                
                <Button variant="default" className="mt-2">
                  Change Password
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <Label className="text-base">Two-Factor Authentication</Label>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                
                <Button variant="outline" className="mt-2">
                  Set Up Two-Factor Authentication
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <Label className="text-base">Privacy Settings</Label>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="analytics" className="text-sm">Allow Usage Analytics</Label>
                  <Switch
                    id="analytics"
                    defaultChecked
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="marketing" className="text-sm">Receive Marketing Emails</Label>
                  <Switch
                    id="marketing"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user assignments to companies and warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
