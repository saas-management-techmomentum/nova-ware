import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVendors, type Vendor, type VendorDashboardData } from '@/hooks/useVendors';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { AddVendorDialog } from '@/components/vendors/AddVendorDialog';
import { EditVendorDialog } from '@/components/vendors/EditVendorDialog';
import { VendorTable } from '@/components/vendors/VendorTable';
import { VendorDetailDialog } from '@/components/vendors/VendorDetailDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorDatabase() {
  const { vendors, isLoading, getVendorDashboardData } = useVendors();
  const { selectedWarehouse } = useWarehouse();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && vendor.is_active) ||
                         (filterStatus === 'inactive' && !vendor.is_active);
    
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true);
      const data = await getVendorDashboardData();
      setDashboardData(data);
      setDashboardLoading(false);
    };

    if (vendors.length >= 0 && !isLoading) {
      loadDashboardData();
    }
  }, [vendors.length, isLoading]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Database</h1>
          <p className="text-muted-foreground">
            Manage suppliers, track transactions, and monitor vendor performance
          </p>
        </div>
        {selectedWarehouse && (
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Active Vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.totalActiveVendors || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Outstanding Payables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `$${(dashboardData?.outstandingPayables || 0).toLocaleString()}`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Top Vendor Spend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `$${(dashboardData?.topVendorsBySpend[0]?.total_spend || 0).toLocaleString()}`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Recent Transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                dashboardData?.recentActivity.length || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors by Spend */}
      {dashboardData?.topVendorsBySpend && dashboardData.topVendorsBySpend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Spend</CardTitle>
            <CardDescription>Vendors with the highest transaction amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topVendorsBySpend.map((vendor, index) => (
                <div key={vendor.vendor_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-foreground">{vendor.vendor_name}</p>
                      <p className="text-sm text-muted-foreground">Total Spend</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${vendor.total_spend.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
          <CardDescription>Search, filter, and manage your vendor relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search vendors by name, contact, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inactive')}
              >
                Inactive
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>

          <VendorTable 
            vendors={filteredVendors}
            onViewVendor={(vendor) => setSelectedVendor(vendor)}
            onEditVendor={(vendor) => {
              setEditingVendor(vendor);
              setShowEditDialog(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddVendorDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditVendorDialog
        vendor={editingVendor}
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingVendor(null);
        }}
      />

      {selectedVendor && (
        <VendorDetailDialog
          vendor={selectedVendor}
          open={!!selectedVendor}
          onOpenChange={(open) => !open && setSelectedVendor(null)}
          onEditVendor={(vendor) => {
            setSelectedVendor(null);
            setEditingVendor(vendor);
            setShowEditDialog(true);
          }}
        />
      )}
    </div>
  );
}