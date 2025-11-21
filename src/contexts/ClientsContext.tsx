
import React, { createContext, useContext, ReactNode } from 'react';
import { useWarehouseScopedClients, Client } from '@/hooks/useWarehouseScopedClients';

interface ClientsContextType {
  clients: Client[];
  isLoading: boolean;
  addClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};

interface ClientsProviderProps {
  children: ReactNode;
}

export const ClientsProvider: React.FC<ClientsProviderProps> = ({ children }) => {
  const { clients, isLoading, addClient, updateClient, deleteClient, refetch } = useWarehouseScopedClients();

  const value = {
    clients,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    refetch
  };

  return (
    <ClientsContext.Provider value={value}>
      {children}
    </ClientsContext.Provider>
  );
};
