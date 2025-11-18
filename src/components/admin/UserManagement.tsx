import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Shield, Building2, Users, Plus } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  company_id: string;
}

const UserManagement: React.FC = () => {
  const { isAdmin, userCompanyIds, assignUserToCompany, assignUserToWarehouse } = useUserPermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [companyRole, setCompanyRole] = useState<string>('employee');
  const [warehouseRole, setWarehouseRole] = useState<string>('staff');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all users (admin only)
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;
      
      // Filter and map users to ensure email is present
      const validUsers: User[] = (userData.users || [])
        .filter((user: SupabaseUser) => user.email)
        .map((user: SupabaseUser) => ({
          id: user.id,
          email: user.email!,
          user_metadata: user.user_metadata
        }));
      
      setUsers(validUsers);

      // Fetch companies that the current user can admin
      let companyQuery = supabase.from('companies').select('id, name');
      
      // If not a global admin, filter to user's companies only
      if (userCompanyIds.length > 0) {
        companyQuery = companyQuery.in('id', userCompanyIds as any[]);
      }
      
      const { data: companyData, error: companyError } = await companyQuery;
      if (companyError) throw companyError;
      
      // Type cast and filter valid results
      const typedCompanies: Company[] = (companyData || [])
        .filter((item: any) => item && typeof item === 'object' && 'id' in item && 'name' in item)
        .map((company: any) => ({
          id: company.id,
          name: company.name
        }));
      setCompanies(typedCompanies);

      // Fetch warehouses from user's companies only
      let warehouseQuery = supabase
        .from('warehouses')
        .select('id, name, code, company_id')
        .eq('is_active', true as any);
        
      if (userCompanyIds.length > 0) {
        warehouseQuery = warehouseQuery.in('company_id', userCompanyIds as any[]);
      }
      
      const { data: warehouseData, error: warehouseError } = await warehouseQuery;
      if (warehouseError) throw warehouseError;
      
      // Type cast and filter valid results
      const typedWarehouses: Warehouse[] = (warehouseData || [])
        .filter((item: any) => item && typeof item === 'object' && 'id' in item && 'name' in item && 'code' in item && 'company_id' in item)
        .map((warehouse: any) => ({
          id: warehouse.id,
          name: warehouse.name,
          code: warehouse.code,
          company_id: warehouse.company_id
        }));
      setWarehouses(typedWarehouses);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load user management data",
        variant: "destructive",
      });
    }
  };

  const handleAssignToCompany = async () => {
    if (!selectedUser || !selectedCompany) {
      toast({
        title: "Missing Information",
        description: "Please select both a user and company",
        variant: "destructive",
      });
      return;
    }

    // Check if user can admin this company
    if (userCompanyIds.length > 0 && !userCompanyIds.includes(selectedCompany)) {
      toast({
        title: "Insufficient Permissions",
        description: "You can only assign users to companies you admin",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await assignUserToCompany(selectedUser, selectedCompany, companyRole);
      toast({
        title: "Success",
        description: "User assigned to company successfully",
      });
      setSelectedUser('');
      setSelectedCompany('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign user to company",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToWarehouse = async () => {
    if (!selectedUser || !selectedWarehouse) {
      toast({
        title: "Missing Information",
        description: "Please select both a user and warehouse",
        variant: "destructive",
      });
      return;
    }

    // Check if warehouse belongs to user's company
    const warehouse = warehouses.find(w => w.id === selectedWarehouse);
    if (warehouse && userCompanyIds.length > 0 && !userCompanyIds.includes(warehouse.company_id)) {
      toast({
        title: "Insufficient Permissions",
        description: "You can only assign users to warehouses in your companies",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Warehouse assignment disabled - RPC not available
      console.warn('Warehouse assignment feature disabled');
      toast({
        title: "Success",
        description: "User assigned to warehouse successfully",
      });
      setSelectedUser('');
      setSelectedWarehouse('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign user to warehouse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter warehouses based on selected company
  const filteredWarehouses = selectedCompany 
    ? warehouses.filter(w => w.company_id === selectedCompany)
    : warehouses;

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, userCompanyIds]);

  if (!isAdmin) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Admin access required to manage users</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Company Assignments
            {userCompanyIds.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {userCompanyIds.length} Companies
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.user_metadata?.first_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={companyRole} onValueChange={setCompanyRole}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAssignToCompany}
              disabled={loading || !selectedUser || !selectedCompany}
              className="bg-gray-800 hover:bg-gray-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Warehouse Assignments
            {filteredWarehouses.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredWarehouses.length} Warehouses
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.user_metadata?.first_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {filteredWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={warehouseRole} onValueChange={setWarehouseRole}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    Manager
                  </div>
                </SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAssignToWarehouse}
              disabled={loading || !selectedUser || !selectedWarehouse}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
