
/**
 * Oracle Adapter
 * 
 * This adapter handles integration with Oracle ERP for enterprise resource planning.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface OracleConfig extends ServiceConfig {
  serverUrl?: string;
  username?: string;
  password?: string;
  serviceName?: string;
  port?: string;
}

class OracleAdapter {
  /**
   * Configure Oracle integration
   */
  configure(config: OracleConfig): void {
    integrationService.configureService('other', config);
  }
  
  /**
   * Check if Oracle is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('other') as OracleConfig;
    return !!(config && config.serverUrl && config.username && config.password);
  }
  
  /**
   * Initialize Oracle connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Oracle not configured.');  
      return false;
    }
    
    try {
  
      integrationService.updateServiceStatus('other', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize Oracle:', error);
      integrationService.updateServiceStatus('other', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Get Oracle connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('other');
  }
}

// Create singleton instance
const oracleAdapter = new OracleAdapter();
export default oracleAdapter;
