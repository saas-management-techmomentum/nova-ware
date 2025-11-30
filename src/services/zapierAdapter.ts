
/**
 * Zapier Adapter
 * 
 * This adapter handles integration with Zapier for custom workflow automation.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface ZapierConfig extends ServiceConfig {
  webhookUrls?: string[];
  apiKey?: string;
}

class ZapierAdapter {
  /**
   * Configure Zapier integration
   */
  configure(config: ZapierConfig): void {
    integrationService.configureService('zapier', config);
  }
  
  /**
   * Check if Zapier is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('zapier') as ZapierConfig;
    return !!(config && config.webhookUrls && config.webhookUrls.length > 0);
  }
  
  /**
   * Initialize Zapier connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Zapier not configured.');
      return false;
    }
    
    try {
      integrationService.updateServiceStatus('zapier', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize Zapier:', error);
      integrationService.updateServiceStatus('zapier', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Trigger Zapier webhook
   */
  async triggerWebhook(webhookUrl: string, payload: Record<string, any>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Cannot trigger webhook: Zapier not configured');
      return false;
    }
    
    try {
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          data: payload
        }),
      });
      
      return true;
    } catch (error) {
      console.error('Failed to trigger Zapier webhook:', error);
      return false;
    }
  }
  
  /**
   * Trigger all configured webhooks
   */
  async triggerAllWebhooks(payload: Record<string, any>): Promise<boolean[]> {
    const config = integrationService.getServiceConfig('zapier') as ZapierConfig;
    if (!this.isConfigured() || !config.webhookUrls) {
      console.error('Cannot trigger webhooks: Zapier not configured');
      return [];
    }
    
    const results = await Promise.all(
      config.webhookUrls.map(url => this.triggerWebhook(url, payload))
    );
    
    return results;
  }
  
  /**
   * Get Zapier connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('zapier');
  }
}

// Create singleton instance
const zapierAdapter = new ZapierAdapter();
export default zapierAdapter;
