
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useRLSContext } from '@/hooks/useRLSContext';

export const RLSTestPanel: React.FC = () => {
  const { dataScope, accessibleWarehouses, runRLSTests, rlsTestResults, refreshRLSContext } = useRLSContext();
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    await runRLSTests();
    setIsRunningTests(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-200">
            <Shield className="h-5 w-5 mr-2 text-cyan-400" />
            Row-Level Security Status
          </CardTitle>
          <CardDescription className="text-slate-400">
            Database-level security enforcement and access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {dataScope?.total_companies || 0}
              </div>
              <div className="text-sm text-slate-400">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {dataScope?.total_warehouses || 0}
              </div>
              <div className="text-sm text-slate-400">Warehouses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {dataScope?.admin_company_ids.length || 0}
              </div>
              <div className="text-sm text-slate-400">Admin Access</div>
            </div>
          </div>

          {dataScope?.is_multi_company_admin && (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                Multi-Company Admin
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-200">
            <Database className="h-5 w-5 mr-2 text-blue-400" />
            Accessible Warehouses
          </CardTitle>
          <CardDescription className="text-slate-400">
            Warehouses you can access based on your role and company assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {accessibleWarehouses.length === 0 ? (
              <div className="text-slate-400 text-center py-4">
                No accessible warehouses found
              </div>
            ) : (
              accessibleWarehouses.map((warehouse) => (
                <div
                  key={warehouse.warehouse_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50"
                >
                  <div>
                    <div className="font-medium text-slate-200">
                      {warehouse.warehouse_name}
                    </div>
                    <div className="text-sm text-slate-400">
                      Code: {warehouse.warehouse_code}
                    </div>
                  </div>
                  <Badge
                    variant={warehouse.access_level === 'admin' ? 'default' : 'secondary'}
                    className={
                      warehouse.access_level === 'admin'
                        ? 'bg-emerald-600 text-white'
                        : warehouse.access_level === 'manager'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-slate-200'
                    }
                  >
                    {warehouse.access_level}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-200">
            <TestTube className="h-5 w-5 mr-2 text-green-400" />
            RLS Policy Testing
          </CardTitle>
          <CardDescription className="text-slate-400">
            Test database security policies to verify proper access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunningTests ? 'Running Tests...' : 'Run RLS Tests'}
            </Button>
            <Button 
              onClick={refreshRLSContext}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Refresh Context
            </Button>
          </div>

          {rlsTestResults && (
            <div className="space-y-3">
              <div className="flex items-center text-emerald-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Tests Completed Successfully
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {rlsTestResults.accessible_records?.products || 0}
                  </div>
                  <div className="text-slate-400">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {rlsTestResults.accessible_records?.orders || 0}
                  </div>
                  <div className="text-slate-400">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {rlsTestResults.accessible_records?.warehouses || 0}
                  </div>
                  <div className="text-slate-400">Warehouses</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-400">
                    {rlsTestResults.accessible_records?.clients || 0}
                  </div>
                  <div className="text-slate-400">Clients</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Last tested: {new Date(rlsTestResults.test_timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
