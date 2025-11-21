
/**
 * Enhanced Integration Service for Financial Management
 * 
 * This service provides comprehensive functionality for connecting with external
 * accounting platforms and extracting financial data including invoices, P&L,
 * balance sheets, and other financial reports.
 */

// Service configuration types
export interface ServiceConfig {
  endpoint?: string;
  apiKey?: string;
  region?: string;
  projectId?: string;
  additionalConfig?: Record<string, any>;
  supabaseKey?: string;
  webhookUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

// Financial data types
export interface FinancialData {
  invoices?: InvoiceData[];
  profitLoss?: ProfitLossData;
  balanceSheet?: BalanceSheetData;
  cashFlow?: CashFlowData;
  customers?: CustomerData[];
  transactions?: TransactionData[];
}

export interface InvoiceData {
  id: string;
  number: string;
  customerName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  issueDate: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export interface ProfitLossData {
  period: string;
  revenue: Array<{ category: string; amount: number; }>;
  expenses: Array<{ category: string; amount: number; }>;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface BalanceSheetData {
  assets: Array<{ category: string; amount: number; }>;
  liabilities: Array<{ category: string; amount: number; }>;
  equity: Array<{ category: string; amount: number; }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface CashFlowData {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalBilled?: number;
  outstandingBalance?: number;
}

export interface TransactionData {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
}

// Integration status tracking
export interface IntegrationStatus {
  connected: boolean;
  lastConnected?: Date;
  lastSyncDate?: Date;
  error?: string;
  connectionDetails?: {
    accountName?: string;
    companyName?: string;
    environment?: string;
  };
}

// Service types supported by the application
export type ServiceType = 'supabase' | 'n8n' | 'vercel' | 'shopify' | 'woocommerce' | 'quickbooks' | 'xero' | 'wave' | 'sage' | 'freshbooks' | 'fedex' | 'shipstation' | 'ups' | 'usps' | 'zapier' | 'other';

// Sync operation types
export interface SyncOperation {
  type: 'customers' | 'invoices' | 'products' | 'transactions';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed?: number;
  errors?: string[];
}

/**
 * Enhanced Integration Service
 * This class provides comprehensive functionality for all service integrations
 */
export class IntegrationService {
  private configs: Map<ServiceType, ServiceConfig> = new Map();
  private status: Map<ServiceType, IntegrationStatus> = new Map();
  private syncHistory: Map<ServiceType, SyncOperation[]> = new Map();
  private financialData: Map<ServiceType, FinancialData> = new Map();
  
  /**
   * Configure a service integration with validation
   */
  configureService(type: ServiceType, config: ServiceConfig): void {
    // Validate required fields based on service type
    if (!this.validateServiceConfig(type, config)) {
      throw new Error(`Invalid configuration for ${type} service`);
    }
    
    this.configs.set(type, config);
    console.log(`Service ${type} configured successfully`);
  }
  
  /**
   * Validate service configuration
   */
  private validateServiceConfig(type: ServiceType, config: ServiceConfig): boolean {
    switch (type) {
      case 'quickbooks':
        return !!(config.clientId && config.accessToken);
      case 'xero':
        return !!(config.clientId && config.accessToken);
      case 'wave':
      case 'sage':
      case 'freshbooks':
        return !!(config.apiKey || config.webhookUrl);
      default:
        return !!(config.endpoint || config.apiKey || config.webhookUrl);
    }
  }
  
  /**
   * Get configuration for a service
   */
  getServiceConfig(type: ServiceType): ServiceConfig | undefined {
    return this.configs.get(type);
  }
  
  /**
   * Update the status of a service connection with enhanced details
   */
  updateServiceStatus(type: ServiceType, connected: boolean, error?: string, details?: any): void {
    this.status.set(type, {
      connected,
      lastConnected: connected ? new Date() : this.status.get(type)?.lastConnected,
      error,
      connectionDetails: details
    });
    
    if (connected) {
      console.log(`✅ ${type} service connected successfully`);
    } else {
      console.error(`❌ ${type}service connection failed:`, error);
    }
  }
  
  /**
   * Get the status of a service connection
   */
  getServiceStatus(type: ServiceType): IntegrationStatus {
    return this.status.get(type) || { connected: false };
  }
  
  /**
   * Get all connected services
   */
  getConnectedServices(): ServiceType[] {
    const connected: ServiceType[] = [];
    for (const [type, status] of this.status.entries()) {
      if (status.connected) {
        connected.push(type);
      }
    }
    return connected;
  }
  
  /**
   * Test connection to a service
   */
  async testConnection(type: ServiceType): Promise<boolean> {
    const config = this.getServiceConfig(type);
    if (!config) {
      throw new Error(`No configuration found for ${type}`);
    }
    
    try {
      // Simulate connection test based on service type
      await this.performConnectionTest(type, config);
      this.updateServiceStatus(type, true);
      return true;
    } catch (error) {
      this.updateServiceStatus(type, false, error instanceof Error ? error.message : 'Connection test failed');
      return false;
    }
  }
  
  /**
   * Perform actual connection test
   */
  private async performConnectionTest(type: ServiceType, config: ServiceConfig): Promise<void> {
    // Simulate API call with timeout
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate success/failure based on configuration completeness
        if (this.validateServiceConfig(type, config)) {
          resolve();
        } else {
          reject(new Error('Invalid configuration parameters'));
        }
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  }
  
  /**
   * Extract financial data from connected platform
   */
  async extractFinancialData(type: ServiceType): Promise<FinancialData | null> {
    if (!this.getServiceStatus(type).connected) {
      throw new Error(`${type} service is not connected`);
    }
    
    try {
      // Simulate financial data extraction
      const data = await this.performFinancialDataExtraction(type);
      this.financialData.set(type, data);
      return data;
    } catch (error) {
      console.error(`Failed to extract financial data from ${type}:`, error);
      throw error;
    }
  }
  
  /**
   * Simulate financial data extraction from platform
   */
  private async performFinancialDataExtraction(type: ServiceType): Promise<FinancialData> {
    console.log(`🔍 Extracting financial data from ${type}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Return sample financial data - in real implementation, this would call the actual APIs
    return {
      invoices: [
        {
          id: 'INV-001',
          number: 'INV-2024-001',
          customerName: 'Sample Customer',
          amount: 1500.00,
          status: 'paid',
          dueDate: '2024-02-15',
          issueDate: '2024-01-15'
        }
      ],
      profitLoss: {
        period: 'Current Month',
        revenue: [
          { category: 'Sales Revenue', amount: 50000 },
          { category: 'Service Revenue', amount: 25000 }
        ],
        expenses: [
          { category: 'Cost of Goods Sold', amount: 20000 },
          { category: 'Operating Expenses', amount: 15000 }
        ],
        totalRevenue: 75000,
        totalExpenses: 35000,
        netProfit: 40000
      },
      customers: [
        {
          id: 'CUST-001',
          name: 'Sample Customer',
          email: 'customer@example.com',
          totalBilled: 5000,
          outstandingBalance: 1500
        }
      ]
    };
  }
  
  /**
   * Get financial data for a service
   */
  getFinancialData(type: ServiceType): FinancialData | null {
    return this.financialData.get(type) || null;
  }
  
  /**
   * Sync data with external service
   */
  async syncData(type: ServiceType, operation: 'customers' | 'invoices' | 'products' | 'transactions', data?: any[]): Promise<SyncOperation> {
    if (!this.getServiceStatus(type).connected) {
      throw new Error(`${type} service is not connected`);
    }
    
    const syncOp: SyncOperation = {
      type: operation,
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
      errors: []
    };
    
    // Add to sync history
    const history = this.syncHistory.get(type) || [];
    history.push(syncOp);
    this.syncHistory.set(type, history);
    
    try {
      // Simulate sync operation
      await this.performSync(type, operation, data);
      
      syncOp.status = 'completed';
      syncOp.completedAt = new Date();
      syncOp.recordsProcessed = data?.length || 0;
      
      // Update last sync date
      const status = this.getServiceStatus(type);
      status.lastSyncDate = new Date();
      this.status.set(type, status);
      
      return syncOp;
    } catch (error) {
      syncOp.status = 'failed';
      syncOp.completedAt = new Date();
      syncOp.errors = [error instanceof Error ? error.message : 'Sync failed'];
      throw error;
    }
  }
  
  /**
   * Perform actual sync operation
   */
  private async performSync(type: ServiceType, operation: string, data?: any[]): Promise<void> {
    console.log(`🔄 Syncing ${operation} with ${type}:`, data?.length || 0, 'records');
    
    // Simulate sync process
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ ${operation} sync with ${type} completed`);
        resolve();
      }, 2000 + Math.random() * 3000); // 2-5 second delay
    });
  }
  
  /**
   * Get sync history for a service
   */
  getSyncHistory(type: ServiceType): SyncOperation[] {
    return this.syncHistory.get(type) || [];
  }
  
  /**
   * Disconnect a service
   */
  disconnect(type: ServiceType): void {
    this.configs.delete(type);
    this.status.delete(type);
    this.syncHistory.delete(type);
    this.financialData.delete(type);
    console.log(`🔌 ${type} service disconnected`);
  }
  
  /**
   * Check if any service of the specified type is connected
   */
  hasConnectedService(type?: ServiceType): boolean {
    if (type) {
      const status = this.getServiceStatus(type);
      return status.connected;
    }
    
    // Check if any service is connected
    for (const [_, status] of this.status.entries()) {
      if (status.connected) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get integration summary
   */
  getIntegrationSummary() {
    const connected = this.getConnectedServices();
    const total = this.configs.size;
    
    return {
      totalConfigured: total,
      totalConnected: connected.length,
      connectedServices: connected,
      lastActivity: this.getLastActivityDate()
    };
  }
  
  /**
   * Get last activity date across all services
   */
  private getLastActivityDate(): Date | null {
    let lastDate: Date | null = null;
    
    for (const [_, status] of this.status.entries()) {
      const dates = [status.lastConnected, status.lastSyncDate].filter(Boolean);
      for (const date of dates) {
        if (!lastDate || (date && date > lastDate)) {
          lastDate = date;
        }
      }
    }
    
    return lastDate;
  }
}

// Create singleton instance
const integrationService = new IntegrationService();
export default integrationService;
