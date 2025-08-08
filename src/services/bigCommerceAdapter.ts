
/**
 * BigCommerce Adapter
 * 
 * This adapter handles integration with BigCommerce for order management and inventory sync.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface BigCommerceConfig extends ServiceConfig {
  storeHash?: string;
  clientId?: string;
  accessToken?: string;
  clientSecret?: string;
}

class BigCommerceAdapter {
  /**
   * Configure BigCommerce integration
   */
  configure(config: BigCommerceConfig): void {
    integrationService.configureService('other', config);
  }
  
  /**
   * Check if BigCommerce is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('other') as BigCommerceConfig;
    return !!(config && config.storeHash && config.clientId && config.accessToken);
  }
  
  /**
   * Initialize BigCommerce connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('BigCommerce not configured.');
      return false;
    }
    
    try {
      console.log('BigCommerce adapter initialized');
      integrationService.updateServiceStatus('other', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize BigCommerce:', error);
      integrationService.updateServiceStatus('other', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Sync inventory to BigCommerce
   */
  async syncInventory(products: Array<{id: string, quantity: number}>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot sync inventory: BigCommerce not configured');
      return false;
    }
    
    try {
      console.log('Syncing inventory to BigCommerce:', products);
      return true;
    } catch (error) {
      console.error('Failed to sync inventory to BigCommerce:', error);
      return false;
    }
  }
  
  /**
   * Get BigCommerce connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('other');
  }
}

// Create singleton instance
const bigCommerceAdapter = new BigCommerceAdapter();
export default bigCommerceAdapter;
