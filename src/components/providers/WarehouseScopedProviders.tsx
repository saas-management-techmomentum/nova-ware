
import React from 'react';
import { ClientsProvider } from '@/contexts/ClientsContext';
import { TasksProvider } from '@/contexts/TasksContext';
import { BillingProvider } from '@/contexts/BillingContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface WarehouseScopedProvidersProps {
  children: React.ReactNode;
}

export const WarehouseScopedProviders: React.FC<WarehouseScopedProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ClientsProvider>
        <TasksProvider>
          <ErrorBoundary>
            <BillingProvider>
              {children}
            </BillingProvider>
          </ErrorBoundary>
        </TasksProvider>
      </ClientsProvider>
    </ErrorBoundary>
  );
};
