
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { InvoiceManagement } from '@/components/billing/InvoiceManagement';
import { RateManagement } from '@/components/billing/RateManagement';
import { BillingReports } from '@/components/billing/BillingReports';

const Billing = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">3PL Billing Management</h1>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="rates">Rate Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <BillingDashboard />
        </TabsContent>
        
        <TabsContent value="invoices">
          <InvoiceManagement />
        </TabsContent>
        
        <TabsContent value="rates">
          <RateManagement />
        </TabsContent>
        
        <TabsContent value="reports">
          <BillingReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
