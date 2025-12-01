
/**
 * Microsoft Dynamics Adapter
 * 
 * This adapter handles integration with Microsoft Dynamics for enterprise resource planning.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface MicrosoftDynamicsConfig extends ServiceConfig {
  serverUrl?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  resource?: string;
}

class MicrosoftDynamicsAdapter {
  /**
   * Configure Microsoft Dynamics integration
   */
  configure(config: MicrosoftDynamicsConfig): void {
    integrationService.configureService('other', config);
  }
  
  /**
   * Check if Microsoft Dynamics is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('other') as MicrosoftDynamicsConfig;
    return !!(config && config.serverUrl && config.tenantId && config.clientId && config.clientSecret);
  }
  
  /**
   * Initialize Microsoft Dynamics connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Microsoft Dynamics not configured.');
      return false;
    }
    
    try {
      integrationService.updateServiceStatus('other', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize Microsoft Dynamics:', error);
      integrationService.updateServiceStatus('other', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Get Microsoft Dynamics connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('other');
  }
}

// Create singleton instance
const microsoftDynamicsAdapter = new MicrosoftDynamicsAdapter();
export default microsoftDynamicsAdapter;
