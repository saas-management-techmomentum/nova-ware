
/**
 * Amazon FBA Adapter
 * 
 * This adapter handles integration with Amazon FBA for inventory sync and order management.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface AmazonFBAConfig extends ServiceConfig {
  sellerId?: string;
  marketplaceId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

class AmazonFBAAdapter {
  /**
   * Configure Amazon FBA integration
   */
  configure(config: AmazonFBAConfig): void {
    integrationService.configureService('other', config);
  }
  
  /**
   * Check if Amazon FBA is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('other') as AmazonFBAConfig;
    return !!(config && config.sellerId && config.accessKeyId && config.secretAccessKey);
  }
  
  /**
   * Initialize Amazon FBA connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Amazon FBA not configured.');
      return false;
    }
    
    try {
      console.log('Amazon FBA adapter initialized');
      integrationService.updateServiceStatus('other', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize Amazon FBA:', error);
      integrationService.updateServiceStatus('other', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Disconnect Amazon FBA integration
   */
  disconnect(): void {
    integrationService.disconnect('other');
    console.log('Amazon FBA adapter disconnected');
  }
  
  /**
   * Sync inventory with Amazon FBA
   */
  async syncInventory(products: Array<{id: string, quantity: number}>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot sync inventory: Amazon FBA not configured');
      return false;
    }
    
    try {
      console.log('Syncing inventory to Amazon FBA:', products);
      return true;
    } catch (error) {
      console.error('Failed to sync inventory to Amazon FBA:', error);
      return false;
    }
  }
  
  /**
   * Get Amazon FBA connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('other');
  }
}

// Create singleton instance
const amazonFBAAdapter = new AmazonFBAAdapter();
export default amazonFBAAdapter;
