
import React from 'react';
import { OrdersProvider } from '@/contexts/OrdersContext';
import { InventoryProvider } from '@/contexts/InventoryContext';
import { WarehouseProvider } from '@/contexts/WarehouseContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { WarehouseScopedProviders } from './WarehouseScopedProviders';
import { WarehouseEmployeeProvider } from '@/contexts/WarehouseEmployeeContext';

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

export const AuthenticatedProviders: React.FC<AuthenticatedProvidersProps> = ({ children }) => {
  return (
    <OnboardingProvider>
      <WarehouseProvider>
        <WarehouseEmployeeProvider>
          <WarehouseScopedProviders>
            <OrdersProvider>
              <InventoryProvider>
                {children}
              </InventoryProvider>
            </OrdersProvider>
          </WarehouseScopedProviders>
        </WarehouseEmployeeProvider>
      </WarehouseProvider>
    </OnboardingProvider>
  );
};

// Add default export
export default AuthenticatedProviders;
