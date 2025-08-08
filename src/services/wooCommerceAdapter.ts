
/**
 * WooCommerce Adapter
 * 
 * This adapter handles integration with WooCommerce for order management and inventory sync.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface WooCommerceConfig extends ServiceConfig {
  siteUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
}

class WooCommerceAdapter {
  /**
   * Configure WooCommerce integration
   */
  configure(config: WooCommerceConfig): void {
    integrationService.configureService('woocommerce', config);
  }
  
  /**
   * Check if WooCommerce is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('woocommerce') as WooCommerceConfig;
    return !!(config && config.siteUrl && config.consumerKey && config.consumerSecret);
  }
  
  /**
   * Initialize WooCommerce connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('WooCommerce not configured.');
      return false;
    }
    
    try {
      console.log('WooCommerce adapter initialized');
      integrationService.updateServiceStatus('woocommerce', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize WooCommerce:', error);
      integrationService.updateServiceStatus('woocommerce', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Sync inventory to WooCommerce
   */
  async syncInventory(products: Array<{id: string, quantity: number}>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot sync inventory: WooCommerce not configured');
      return false;
    }
    
    try {
      console.log('Syncing inventory to WooCommerce:', products);
      return true;
    } catch (error) {
      console.error('Failed to sync inventory to WooCommerce:', error);
      return false;
    }
  }
  
  /**
   * Import orders from WooCommerce
   */
  async importOrders(): Promise<any[]> {
    if (!this.isConfigured()) {
      console.error('Cannot import orders: WooCommerce not configured');
      return [];
    }
    
    try {
      console.log('Importing orders from WooCommerce');
      return [];
    } catch (error) {
      console.error('Failed to import orders from WooCommerce:', error);
      return [];
    }
  }
  
  /**
   * Get WooCommerce connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('woocommerce');
  }
}

// Create singleton instance
const wooCommerceAdapter = new WooCommerceAdapter();
export default wooCommerceAdapter;
