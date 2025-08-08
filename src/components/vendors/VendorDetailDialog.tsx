import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Calendar, 
  DollarSign,
  FileText,
  TrendingUp,
  Edit
} from 'lucide-react';
import { type Vendor, type VendorTransaction } from '@/hooks/useVendors';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorDetailDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditVendor?: (vendor: Vendor) => void;
}

export function VendorDetailDialog({ vendor, open, onOpenChange, onEditVendor }: VendorDetailDialogProps) {
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpend, setTotalSpend] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (open && vendor.id) {
      fetchVendorData();
    }
  }, [open, vendor.id]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch vendor transactions
      const { data: transactionData, error } = await supabase
        .from('vendor_transactions')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      setTransactions((transactionData || []) as VendorTransaction[]);

      // Calculate total spend
      const total = transactionData?.reduce((sum, transaction) => {
        return sum + Number(transaction.amount);
      }, 0) || 0;

      setTotalSpend(total);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return 'bg-blue-100 text-blue-800';
      case 'invoice':
        return 'bg-orange-100 text-orange-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return <FileText className="h-4 w-4" />;
      case 'invoice':
        return <DollarSign className="h-4 w-4" />;
      case 'payment':
        return <TrendingUp className="h-4 w-4" />;
      case 'expense':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{vendor.vendor_name}</span>
            {onEditVendor && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => onEditVendor(vendor)}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Vendor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.contact_person && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {vendor.contact_person.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{vendor.contact_person}</p>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                      </div>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{vendor.email}</p>
                        <p className="text-sm text-muted-foreground">Email</p>
                      </div>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{vendor.phone}</p>
                        <p className="text-sm text-muted-foreground">Phone</p>
                      </div>
                    </div>
                  )}

                  {vendor.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{vendor.address}</p>
                        <p className="text-sm text-muted-foreground">Address</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={vendor.is_active ? "default" : "secondary"}>
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Terms</span>
                    <Badge variant="outline">{vendor.payment_terms}</Badge>
                  </div>

                  {vendor.rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < vendor.rating! 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm">({vendor.rating})</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm">
                      {format(new Date(vendor.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Spend</span>
                    <span className="text-sm font-medium">
                      {loading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        `$${totalSpend.toLocaleString()}`
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {vendor.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {vendor.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All financial transactions with this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground">
                      Transactions will appear here as they are recorded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getTransactionTypeColor(transaction.transaction_type)}`}>
                            {getTransactionIcon(transaction.transaction_type)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">
                              {transaction.transaction_type.replace('_', ' ')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                              {transaction.reference_id && (
                                <>
                                  <span>•</span>
                                  <span>Ref: {transaction.reference_id}</span>
                                </>
                              )}
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${Number(transaction.amount).toLocaleString()}
                          </p>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Contracts</CardTitle>
                <CardDescription>
                  Store important documents and contracts with this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload contracts, agreements, and other important documents
                  </p>
                  <Button variant="outline">
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}