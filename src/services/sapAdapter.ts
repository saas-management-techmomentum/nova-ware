
/**
 * SAP Adapter
 * 
 * This adapter handles integration with SAP for enterprise resource planning.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface SAPConfig extends ServiceConfig {
  serverUrl?: string;
  username?: string;
  password?: string;
  client?: string;
  systemNumber?: string;
}

class SAPAdapter {
  /**
   * Configure SAP integration
   */
  configure(config: SAPConfig): void {
    integrationService.configureService('other', config);
  }
  
  /**
   * Check if SAP is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('other') as SAPConfig;
    return !!(config && config.serverUrl && config.username && config.password);
  }
  
  /**
   * Initialize SAP connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('SAP not configured.');
      return false;
    }
    
    try {
      console.log('SAP adapter initialized');
      integrationService.updateServiceStatus('other', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize SAP:', error);
      integrationService.updateServiceStatus('other', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Get SAP connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('other');
  }
}

// Create singleton instance
const sapAdapter = new SAPAdapter();
export default sapAdapter;
