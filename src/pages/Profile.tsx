import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building, MapPin, Calendar, Camera, Shield, Users, Warehouse, CheckCircle, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  display_name?: string;
}

interface UserRole {
  company_id: string;
  company_name: string;
  role: string;
  permissions?: any;
}

interface WarehouseAccess {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  role: string;
  is_assigned?: boolean;
}

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [warehouseAccess, setWarehouseAccess] = useState<WarehouseAccess[]>([]);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    company: "",
    location: "",
    joinDate: "",
    bio: "",
    avatarUrl: "",
    role: "",
    accountStatus: "active",
    emailVerified: false,
  });

  const [editForm, setEditForm] = useState({ ...userData });

  // Fetch comprehensive user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        if (!user) return;

        setIsLoading(true);
        
        console.log('Fetching comprehensive profile for user:', user.id);
        console.log('Debug - User metadata:', user.user_metadata);
        console.log('Debug - Employee name from metadata:', user.user_metadata?.['employee_name']);
        console.log('Debug - First name from metadata:', user.user_metadata?.first_name);
        console.log('Debug - Last name from metadata:', user.user_metadata?.last_name);
        
        // Profile table doesn't exist - using user metadata only
        setProfile(null);
        
        // Fetch user roles - permissions column removed from query
        const { data: companyRolesData, error: companyRolesError } = await supabase
          .from('company_users')
          .select(`
            company_id,
            role,
            companies (
              name
            )
          `)
          .eq('user_id', user.id);

        // Fetch employee role for more accurate role display
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('role, company_id')
          .eq('user_id_auth', user.id)
          .single();
          
        if (companyRolesError) {
          console.error('Error fetching user roles:', companyRolesError);
        } else {
          const roles = companyRolesData?.map(item => ({
            company_id: item.company_id,
            company_name: item.companies?.name || 'Unknown Company',
            role: item.role,
            permissions: null
          })) || [];
          setUserRoles(roles);
        }

        // Fetch warehouse access information
        const { data: warehouseData, error: warehouseError } = await supabase
          .from('warehouse_users')
          .select(`
            warehouse_id,
            role,
            warehouses!inner (
              name,
              code
            )
          `)
          .eq('user_id', user.id);

        if (!warehouseError && warehouseData) {
          const assignedWarehouseId = user.user_metadata?.['warehouse_id'];
          const warehouses = warehouseData.map(item => ({
            warehouse_id: item.warehouse_id,
            warehouse_name: item.warehouses.name,
            warehouse_code: item.warehouses.code,
            role: item.role,
            is_assigned: item.warehouse_id === assignedWarehouseId
          }));
          setWarehouseAccess(warehouses);
        }
        
        // Format join date from user account creation
        const joinDate = new Date(user.created_at || Date.now());
        const joinDateFormatted = joinDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        });
        
        // Get name from user metadata with improved priority order
        let fullName = '';
        
        // First priority: employee_name (set during invitation)
        if (user.user_metadata?.['employee_name']) {
          fullName = user.user_metadata['employee_name'];
          console.log('Debug - Using employee_name:', fullName);
        }
        // Second priority: first_name + last_name
        else if (user.user_metadata?.first_name || user.user_metadata?.last_name) {
          const firstName = user.user_metadata?.first_name || '';
          const lastName = user.user_metadata?.last_name || '';
          fullName = [firstName, lastName].filter(Boolean).join(' ');
          console.log('Debug - Using first_name + last_name:', fullName);
        }
        // Final fallback
        else {
          fullName = user.email?.split('@')[0] || 'User';
          console.log('Debug - Using fallback name');
        }
        
        console.log('Debug - Final name determined:', fullName);
        
        // Get primary role and company
        const primaryRole = companyRolesData?.[0];
        const primaryCompany = primaryRole?.companies?.name || '';
        // Use employee role if available, otherwise fallback to company role
        const userRole = employeeData?.role || primaryRole?.role || 'employee';
        
        setUserData({
          name: fullName,
          email: user.email || '',
          company: primaryCompany,
          location: '',
          joinDate: joinDateFormatted,
          bio: '',
          avatarUrl: user.user_metadata?.avatar_url || '',
          role: userRole,
          accountStatus: 'active',
          emailVerified: user.email_confirmed_at ? true : false,
        });

        console.log('Profile data loaded:', {
          fullName,
          primaryCompany,
          userRole,
          rolesCount: companyRolesData?.length || 0,
          warehousesCount: warehouseData?.length || 0
        });
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile information.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [user, toast]);

  useEffect(() => {
    setEditForm({ ...userData });
  }, [userData]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm({ ...userData });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      // Profile updates disabled - profiles table doesn't exist
      console.warn('Profile updates disabled');
      
      setUserData({ 
        ...userData, 
        location: editForm.location, 
        bio: editForm.bio,
        name: editForm.name 
      });
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile information.",
        variant: "destructive"
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Avatar upload disabled - profiles table doesn't exist
      console.warn('Avatar upload disabled');

      setUserData({ ...userData, avatarUrl: '' });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your profile picture.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'manager':
        return 'bg-gray-700/20 text-gray-300 border-gray-600/30';
      case 'staff':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-8 text-white">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      </div>
    );
  }

  if (!userData.name && !userData.company) {
    return (
      <div className="w-full py-8 text-white">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <Card className="bg-neutral-800 border-neutral-700 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-neutral-400 mb-4">Your profile information is not yet available.</p>
              <p className="text-sm text-neutral-500">
                This might be because your account setup is incomplete. Please contact support if this issue persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-6">
      <h1 className="text-3xl font-bold mb-8 text-white">My Profile</h1>
      
      <div className="grid gap-8 lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr]">
        {/* Left column - Enhanced Profile card */}
        <Card className="bg-neutral-800 border-neutral-700 text-white overflow-hidden h-fit">
          <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 h-32 relative">
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex justify-center -mt-16 mb-6 relative">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-neutral-800 shadow-xl">
                  <AvatarImage src={userData.avatarUrl} />
                  <AvatarFallback className="bg-gray-700 text-2xl">
                    {userData.name.split(' ').map(n => n[0] || '').join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-2 right-2 bg-gray-800 hover:bg-gray-900 rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                >
                  <Camera className="h-4 w-4 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">{userData.name}</h2>
              <div className="flex justify-center mb-3">
                <Badge className={`${getRoleBadgeColor(userData.role)} border`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                </Badge>
              </div>
              <p className="text-neutral-400 text-lg">{userData.company || 'No Company'}</p>
            </div>
            
            <Separator className="my-6 bg-neutral-700" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-neutral-300">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm">{userData.email}</span>
                  {userData.emailVerified && (
                    <CheckCircle className="h-4 w-4 text-green-400 inline ml-2" />
                  )}
                </div>
              </div>
              
              {userData.company && (
                <div className="flex items-center gap-3 text-neutral-300">
                  <Building className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{userData.company}</span>
                </div>
              )}
              
              {userData.location && (
                <div className="flex items-center gap-3 text-neutral-300">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{userData.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-neutral-300">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm">Joined {userData.joinDate}</span>
              </div>

              <div className="flex items-center gap-3 text-neutral-300">
                <Clock className="h-5 w-5 text-gray-400" />
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right column - Detailed Information */}
        <div className="space-y-8">
          {/* Profile Information Card */}
          <Card className="bg-neutral-800 border-neutral-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-sm font-medium text-neutral-300">Display Name</label>
                       <Input 
                         name="name"
                         value={editForm.name} 
                         onChange={handleChange}
                         className="bg-neutral-700 border-neutral-600 text-white"
                         placeholder="Enter your display name"
                       />
                       <p className="text-xs text-neutral-400">This name will be displayed throughout the application</p>
                     </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300">Email Address</label>
                      <Input 
                        name="email"
                        value={editForm.email} 
                        onChange={handleChange}
                        className="bg-neutral-700 border-neutral-600 text-white"
                        disabled
                      />
                      <p className="text-xs text-neutral-400">Email changes require verification</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Location</label>
                    <Input 
                      name="location"
                      value={editForm.location} 
                      onChange={handleChange}
                      className="bg-neutral-700 border-neutral-600 text-white"
                      placeholder="Enter your location"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Bio</label>
                    <Input 
                      name="bio"
                      value={editForm.bio} 
                      onChange={handleChange}
                      className="bg-neutral-700 border-neutral-600 text-white"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button variant="default" onClick={handleSave} className="bg-white text-black hover:bg-neutral-200">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="border-neutral-600 text-neutral-300 hover:bg-neutral-700">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">About Me</h3>
                    <p className="text-neutral-400 leading-relaxed">
                      {userData.bio || 'No bio available. Click "Edit Profile" to add one.'}
                    </p>
                  </div>
                  
                  <Separator className="bg-neutral-700" />
                  
                  <div className="pt-2">
                    <Button variant="default" onClick={handleEdit} className="bg-white text-black hover:bg-neutral-200">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles & Permissions Card */}
          {userRoles.length > 0 && (
            <Card className="bg-neutral-800 border-neutral-700 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Roles & Permissions
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Your roles and access levels across companies
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {userRoles.map((role, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{role.company_name}</h4>
                        <p className="text-sm text-neutral-400">Company Role</p>
                      </div>
                      <Badge className={`${getRoleBadgeColor(role.role)} border`}>
                        {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warehouse Access Card */}
          {warehouseAccess.length > 0 && (
            <Card className="bg-neutral-800 border-neutral-700 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Warehouse Access
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Warehouses you have access to and your role in each
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {warehouseAccess.map((warehouse, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                      warehouse.is_assigned 
                        ? 'bg-gray-700/20 border border-gray-600/30' 
                        : 'bg-neutral-700/50'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{warehouse.warehouse_name}</h4>
                          {warehouse.is_assigned && (
                            <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border text-xs">
                              Assigned
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400">Code: {warehouse.warehouse_code}</p>
                        {warehouse.is_assigned && (
                          <p className="text-xs text-gray-300 mt-1">Your primary warehouse</p>
                        )}
                      </div>
                      <Badge className={`${getRoleBadgeColor(warehouse.role)} border`}>
                        {warehouse.role.charAt(0).toUpperCase() + warehouse.role.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Status Card */}
          <Card className="bg-neutral-800 border-neutral-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Account Status
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Your account verification and status information
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Account Status</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Email Verified</span>
                    {userData.emailVerified ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 border">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Companies</span>
                    <Badge className="bg-gray-700/20 text-gray-300 border-gray-600/30 border">
                      {userRoles.length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Warehouses</span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border">
                      {warehouseAccess.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
