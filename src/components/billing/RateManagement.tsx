
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBilling } from '@/contexts/BillingContext';
import { useClients } from '@/contexts/ClientsContext';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Plus, DollarSign, Edit, Trash2 } from 'lucide-react';
import DisabledWrapper from '@/components/inventory/DisabledWrapper';

export const RateManagement = () => {
  const { billingRates, addBillingRate, isLoading } = useBilling();
  const { clients } = useClients();
  const { selectedWarehouse, canViewAllWarehouses } = useWarehouse();
  const [newRate, setNewRate] = useState({
    client_id: '',
    service_type: '',
    rate_type: '',
    rate_amount: '',
    unit: '',
    effective_date: ''
  });

  const isInCorporateOverview = canViewAllWarehouses && selectedWarehouse === null;

  const handleAddRate = async () => {
    if (!newRate.client_id || !newRate.service_type || !newRate.rate_amount) return;
    
    try {
      await addBillingRate({
        client_id: newRate.client_id,
        service_type: newRate.service_type,
        rate_type: newRate.rate_type,
        rate_amount: parseFloat(newRate.rate_amount),
        unit: newRate.unit,
        effective_date: newRate.effective_date || new Date().toISOString().split('T')[0]
      });

      setNewRate({
        client_id: '',
        service_type: '',
        rate_type: '',
        rate_amount: '',
        unit: '',
        effective_date: ''
      });
    } catch (error) {
      console.error('Error adding billing rate:', error);
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading billing rates...</div>;
  }

  // Only show warehouse selection message if not in corporate overview and no warehouse selected
  if (!selectedWarehouse && !canViewAllWarehouses) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <DollarSign className="h-16 w-16 mb-4 text-slate-500" />
          <p className="text-lg font-medium mb-2 text-white">Select a Warehouse</p>
          <p className="text-sm text-slate-400 text-center max-w-md">
            Please select a warehouse to manage billing rates for that location.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Rate Management</h2>
          {isInCorporateOverview && (
            <p className="text-slate-400 mt-1">Showing rates from all warehouses</p>
          )}
        </div>
      </div>

      {/* Add New Rate - Only show if not in Corporate Overview */}
      {!isInCorporateOverview && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="h-5 w-5 mr-2 text-slate-400" />
              Add New Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Select value={newRate.client_id} onValueChange={(value) => setNewRate({...newRate, client_id: value})}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={newRate.service_type} onValueChange={(value) => setNewRate({...newRate, service_type: value})}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="handling">Handling</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="receiving">Receiving</SelectItem>
                </SelectContent>
              </Select>

              <Select value={newRate.rate_type} onValueChange={(value) => setNewRate({...newRate, rate_type: value})}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Rate Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_pallet">Per Pallet</SelectItem>
                  <SelectItem value="per_unit">Per Unit</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Rate Amount"
                type="number"
                value={newRate.rate_amount}
                onChange={(e) => setNewRate({...newRate, rate_amount: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddRate} className="bg-gray-800 hover:bg-gray-900">
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Corporate Overview - Disabled Add Rate Form */}
      {isInCorporateOverview && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="h-5 w-5 mr-2 text-slate-400" />
              Add New Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <DollarSign className="h-12 w-12 mb-3 text-slate-500" />
              <p className="text-lg font-medium mb-2">Rate Creation Disabled</p>
              <p className="text-sm text-slate-500 text-center max-w-md">
                Select a specific warehouse to create new billing rates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rates Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-emerald-400" />
            Current Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <DollarSign className="h-16 w-16 mb-4 text-slate-500" />
              <p className="text-lg font-medium mb-2">No billing rates found</p>
              <p className="text-sm text-slate-500 text-center max-w-md mb-4">
                {isInCorporateOverview 
                  ? "No billing rates found across all warehouses."
                  : "Set up billing rates to track pricing for this warehouse."
                }
              </p>
              {!isInCorporateOverview && (
                <Button 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Rate Amount"]') as HTMLInputElement;
                    input?.focus();
                  }} 
                  className="bg-gray-800 hover:bg-gray-900"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Rate
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Client</TableHead>
                  <TableHead className="text-slate-300">Service</TableHead>
                  <TableHead className="text-slate-300">Rate Type</TableHead>
                  <TableHead className="text-slate-300">Amount</TableHead>
                  <TableHead className="text-slate-300">Unit</TableHead>
                  <TableHead className="text-slate-300">Effective Date</TableHead>
                  {isInCorporateOverview && (
                    <TableHead className="text-slate-300">Warehouse</TableHead>
                  )}
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRates.map((rate) => (
                  <TableRow key={rate.id} className="border-slate-700">
                    <TableCell className="text-white">
                      {clients.find(c => c.id === rate.client_id)?.name || rate.client_id}
                    </TableCell>
                    <TableCell className="text-slate-300 capitalize">{rate.service_type}</TableCell>
                    <TableCell className="text-slate-300">{rate.rate_type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-white">${rate.rate_amount}</TableCell>
                    <TableCell className="text-slate-300">{rate.unit}</TableCell>
                    <TableCell className="text-slate-300">{new Date(rate.effective_date).toLocaleDateString()}</TableCell>
                    {isInCorporateOverview && (
                      <TableCell className="text-slate-300">
                        {rate.warehouse_id ? `WH-${rate.warehouse_id.slice(0, 8)}` : 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <DisabledWrapper
                          disabled={isInCorporateOverview}
                          tooltipContent="Select a specific warehouse to edit rates"
                        >
                          <Button size="sm" variant="outline" className="border-slate-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DisabledWrapper>
                        <DisabledWrapper
                          disabled={isInCorporateOverview}
                          tooltipContent="Select a specific warehouse to delete rates"
                        >
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-slate-600 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DisabledWrapper>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
