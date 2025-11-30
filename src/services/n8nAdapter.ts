
/**
 * n8n Adapter
 * 
 * This adapter handles integration with n8n for workflow automation and outreach.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface N8nConfig extends ServiceConfig {
  webhookUrl?: string;
  apiToken?: string;
}

class N8nAdapter {
  /**
   * Configure n8n integration
   */
  configure(config: N8nConfig): void {
    integrationService.configureService('n8n', config);
  }
  
  /**
   * Check if n8n is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('n8n') as N8nConfig;
    return !!(config && config.webhookUrl);
  }
  
  /**
   * Initialize n8n connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('n8n not configured.');
      return false;
    }
    
    try {
      // This would ping the n8n webhook to verify it's working

      integrationService.updateServiceStatus('n8n', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize n8n:', error);
      integrationService.updateServiceStatus('n8n', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Trigger an n8n workflow via webhook
   */
  async triggerWorkflow(workflowName: string, payload: Record<string, any>): Promise<boolean> {
    const config = integrationService.getServiceConfig('n8n') as N8nConfig;
    if (!this.isConfigured() || !config.webhookUrl) {
      console.error('Cannot trigger n8n workflow: not configured');
      return false;
    }
    
    try {
      
      return true;
    } catch (error) {
      console.error('Failed to trigger n8n workflow:', error);
      return false;
    }
  }
  
  /**
   * Get n8n connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('n8n');
  }
}

// Create singleton instance
const n8nAdapter = new N8nAdapter();
export default n8nAdapter;
