
/**
 * Vercel Adapter
 * 
 * This adapter handles integration with Vercel for deployment and configuration.
 */

import integrationService, { ServiceConfig } from './integrationService';

export interface VercelConfig extends ServiceConfig {
  teamId?: string;
  projectName?: string;
  token?: string;
}

class VercelAdapter {
  /**
   * Configure Vercel integration
   */
  configure(config: VercelConfig): void {
    integrationService.configureService('vercel', config);
  }
  
  /**
   * Check if Vercel is configured
   */
  isConfigured(): boolean {
    const config = integrationService.getServiceConfig('vercel') as VercelConfig;
    return !!(config && config.token && config.projectName);
  }
  
  /**
   * Initialize Vercel connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Vercel not configured.');
      return false;
    }
    
    try {
      // This would verify the Vercel token and project access
      integrationService.updateServiceStatus('vercel', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize Vercel:', error);
      integrationService.updateServiceStatus('vercel', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Check if the application is running in a Vercel environment
   */
  isRunningOnVercel(): boolean {
    // Vercel sets specific environment variables when running on their platform
    return typeof window !== 'undefined' && 
      window.location.hostname.includes('vercel.app');
  }
  
  /**
   * Get Vercel environment information
   */
  getEnvironmentInfo(): Record<string, string> {
    // This would return information about the current Vercel deployment
    return {
      environment: this.isRunningOnVercel() ? 'vercel' : 'local',
      // Additional environment info would be added here
    };
  }
  
  /**
   * Get Vercel connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('vercel');
  }
}

// Create singleton instance
const vercelAdapter = new VercelAdapter();
export default vercelAdapter;
