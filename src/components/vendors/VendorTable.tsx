import React from 'react';
import { format } from 'date-fns';
import { Eye, Edit, MoreHorizontal, Mail, Phone, Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Vendor } from '@/hooks/useVendors';

interface VendorTableProps {
  vendors: Vendor[];
  onViewVendor: (vendor: Vendor) => void;
  onEditVendor?: (vendor: Vendor) => void;
}

export function VendorTable({ vendors, onViewVendor, onEditVendor }: VendorTableProps) {
  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-2">No vendors found</div>
        <div className="text-sm text-muted-foreground">
          Add your first vendor to get started with supplier management
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Payment Terms</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div>
                  <div className="font-medium text-foreground">{vendor.vendor_name}</div>
                  {vendor.contact_person && (
                    <div className="text-sm text-muted-foreground">{vendor.contact_person}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {vendor.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{vendor.phone}</span>
                    </div>
                  )}
                  {!vendor.email && !vendor.phone && (
                    <span className="text-sm text-muted-foreground">No contact info</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{vendor.payment_terms}</Badge>
              </TableCell>
              <TableCell>
                {vendor.rating ? (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < vendor.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({vendor.rating})</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Not rated</span>
                )}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={vendor.is_active ? "default" : "secondary"}
                  className={vendor.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                >
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(vendor.updated_at), 'MMM dd, yyyy')}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onViewVendor(vendor)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {onEditVendor && (
                      <DropdownMenuItem
                        onClick={() => onEditVendor(vendor)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Vendor
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {vendor.email && (
                      <DropdownMenuItem
                        onClick={() => window.open(`mailto:${vendor.email}`, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    {vendor.phone && (
                      <DropdownMenuItem
                        onClick={() => window.open(`tel:${vendor.phone}`, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Call Vendor
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}