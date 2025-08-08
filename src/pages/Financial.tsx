
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceManagement, RateManagement } from '@/components/billing';
import { FinancialDashboard } from '@/components/financial/FinancialDashboard';
import { AccountsReceivable } from '@/components/financial/AccountsReceivable';
import { AccountsPayable } from '@/components/financial/AccountsPayable';
import { InventoryFinancial } from '@/components/financial/InventoryFinancial';
import { ExpensesFinancial } from '@/components/financial/ExpensesFinancial';
import { PayrollFinancial } from '@/components/financial/PayrollFinancial';
import { ReportsFinancial } from '@/components/financial/ReportsFinancial';
import { GeneralLedger } from '@/components/financial/GeneralLedger';
import ChartOfAccounts from '@/components/financial/ChartOfAccounts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { BankReconciliation } from '@/components/financial/BankReconciliation';
import { PurchaseOrders } from '@/components/financial/PurchaseOrders';

const Financial = () => {
  const { isAdmin, warehouseAssignments } = useUserPermissions();

  // Check if user can view payroll (admin or manager only)
  const canViewPayroll = isAdmin || warehouseAssignments.some(w => w.role === 'manager');

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Management</h1>
          <p className="text-slate-400 mt-1">
            Complete financial management and accounting system
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-12 bg-slate-800/50 h-auto flex-wrap gap-1 p-2">
          <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts-receivable" className="text-sm">AR</TabsTrigger>
          <TabsTrigger value="invoicing" className="text-sm">Invoicing</TabsTrigger>
          <TabsTrigger value="accounts-payable" className="text-sm">AP</TabsTrigger>
          <TabsTrigger value="expenses" className="text-sm">Expenses</TabsTrigger>
          <TabsTrigger value="bank-reconciliation" className="text-sm">Bank</TabsTrigger>
          <TabsTrigger value="general-ledger" className="text-sm">GL</TabsTrigger>
          <TabsTrigger value="inventory" className="text-sm">Inventory</TabsTrigger>
          {canViewPayroll && (
            <TabsTrigger value="payroll" className="text-sm">Payroll</TabsTrigger>
          )}
          <TabsTrigger value="purchase-orders" className="text-sm">PO</TabsTrigger>
          <TabsTrigger value="chart-of-accounts" className="text-sm">COA</TabsTrigger>
          <TabsTrigger value="reports" className="text-sm">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <FinancialDashboard 
            connectedPlatforms={[]}
            isLoading={false}
          />
        </TabsContent>
        
        <TabsContent value="chart-of-accounts">
          <ChartOfAccounts />
        </TabsContent>
        
        <TabsContent value="accounts-receivable">
          <AccountsReceivable />
        </TabsContent>

        <TabsContent value="accounts-payable">
          <AccountsPayable />
        </TabsContent>

        <TabsContent value="general-ledger">
          <GeneralLedger />
        </TabsContent>
        
        <TabsContent value="bank-reconciliation">
          <BankReconciliation />
        </TabsContent>
        
        <TabsContent value="purchase-orders">
          <PurchaseOrders />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryFinancial />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesFinancial />
        </TabsContent>

        {canViewPayroll && (
          <TabsContent value="payroll">
            <PayrollFinancial />
          </TabsContent>
        )}

        <TabsContent value="reports">
          <ReportsFinancial />
        </TabsContent>
        
        <TabsContent value="invoicing">
          <Tabs defaultValue="management" className="space-y-4">
            <TabsList className="bg-slate-700/50">
              <TabsTrigger value="management">Invoice Management</TabsTrigger>
              <TabsTrigger value="rates">Rate Management</TabsTrigger>
            </TabsList>
            <TabsContent value="management">
              <InvoiceManagement />
            </TabsContent>
            <TabsContent value="rates">
              <RateManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financial;
