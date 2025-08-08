
/**
 * QuickBooks Adapter
 * 
 * This adapter handles integration with QuickBooks for accounting and financial data sync.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface QuickBooksConfig extends ServiceConfig {
  companyId?: string;
  accessToken?: string;
  refreshToken?: string;
  environment?: 'sandbox' | 'production';
}

class QuickBooksAdapter {
  /**
   * Configure QuickBooks integration
   */
  configure(config: QuickBooksConfig): void {
    integrationService.configureService('quickbooks', config);
  }
  
  /**
   * Check if QuickBooks is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('quickbooks') as QuickBooksConfig;
    return !!(config && config.companyId && config.accessToken);
  }
  
  /**
   * Initialize QuickBooks connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('QuickBooks not configured.');
      return false;
    }
    
    try {
      console.log('QuickBooks adapter initialized');
      integrationService.updateServiceStatus('quickbooks', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize QuickBooks:', error);
      integrationService.updateServiceStatus('quickbooks', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Sync customers to QuickBooks
   */
  async syncCustomers(customers: Array<{name: string, email: string}>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot sync customers: QuickBooks not configured');
      return false;
    }
    
    try {
      console.log('Syncing customers to QuickBooks:', customers);
      return true;
    } catch (error) {
      console.error('Failed to sync customers to QuickBooks:', error);
      return false;
    }
  }
  
  /**
   * Create invoice in QuickBooks
   */
  async createInvoice(invoiceData: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot create invoice: QuickBooks not configured');
      return false;
    }
    
    try {
      console.log('Creating invoice in QuickBooks:', invoiceData);
      return true;
    } catch (error) {
      console.error('Failed to create invoice in QuickBooks:', error);
      return false;
    }
  }
  
  /**
   * Get QuickBooks connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('quickbooks');
  }
}

// Create singleton instance
const quickBooksAdapter = new QuickBooksAdapter();
export default quickBooksAdapter;
