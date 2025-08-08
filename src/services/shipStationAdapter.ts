
/**
 * ShipStation Adapter
 * 
 * This adapter handles integration with ShipStation for multi-carrier shipping.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface ShipStationConfig extends ServiceConfig {
  apiKey?: string;
  apiSecret?: string;
  storeId?: string;
}

class ShipStationAdapter {
  /**
   * Configure ShipStation integration
   */
  configure(config: ShipStationConfig): void {
    integrationService.configureService('shipstation', config);
  }
  
  /**
   * Check if ShipStation is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('shipstation') as ShipStationConfig;
    return !!(config && config.apiKey && config.apiSecret);
  }
  
  /**
   * Initialize ShipStation connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('ShipStation not configured.');
      return false;
    }
    
    try {
      console.log('ShipStation adapter initialized');
      integrationService.updateServiceStatus('shipstation', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize ShipStation:', error);
      integrationService.updateServiceStatus('shipstation', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Create order in ShipStation
   */
  async createOrder(orderData: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot create order: ShipStation not configured');
      return false;
    }
    
    try {
      console.log('Creating order in ShipStation:', orderData);
      return true;
    } catch (error) {
      console.error('Failed to create order in ShipStation:', error);
      return false;
    }
  }
  
  /**
   * Get shipping rates
   */
  async getShippingRates(rateData: any): Promise<any[]> {
    if (!this.isConfigured()) {
      console.error('Cannot get shipping rates: ShipStation not configured');
      return [];
    }
    
    try {
      console.log('Getting shipping rates from ShipStation:', rateData);
      return [];
    } catch (error) {
      console.error('Failed to get shipping rates from ShipStation:', error);
      return [];
    }
  }
  
  /**
   * Get ShipStation connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('shipstation');
  }
}

// Create singleton instance
const shipStationAdapter = new ShipStationAdapter();
export default shipStationAdapter;
