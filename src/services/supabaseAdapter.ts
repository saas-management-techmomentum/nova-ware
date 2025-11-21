


import integrationService, { ServiceConfig } from './integrationService';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseConfig extends ServiceConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
}

class SupabaseAdapter {
  /**
   * Configure Supabase integration
   */
  configure(config: SupabaseConfig): void {
    integrationService.configureService('supabase', config);
    
    // Make sure we store configuration securely
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        // Only store in sessionStorage for added security
        sessionStorage.setItem('supabase_url', config.supabaseUrl);
        // Never store private keys in local/session storage in production
        // This is only for demo purposes
      } catch (error) {
        console.error('Error storing Supabase config:', error);
      }
    }
  }
  
  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    // Check if we have a valid session first
    // Fix: Use getSession() method instead of accessing session property directly
    // We'll check session in the initialize method instead
    
    const config = integrationService.getServiceConfig('supabase') as SupabaseConfig;
    return !!(config && config.supabaseUrl && config.supabaseKey);
  }
  
  /**
   * Initialize Supabase client
   */
  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured.');
      return false;
    }
    
    try {
      // Test the connection by getting the session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        integrationService.updateServiceStatus('supabase', false, error.message);
        return false;
      }
      
      console.log('Supabase adapter initialized - ready for native integration');
      integrationService.updateServiceStatus('supabase', true);
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      integrationService.updateServiceStatus('supabase', false, 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  /**
   * Get Supabase connection status
   */
  getStatus() {
    return integrationService.getServiceStatus('supabase');
  }
  
  /**
   * Get service configuration safely (no sensitive data)
   */
  getServiceConfig(service: string) {
    // Filter out sensitive data
    const config = integrationService.getServiceConfig('supabase');
    if (config) {
      // Fix: Update property names in destructuring to match the SupabaseConfig interface
      const { supabaseKey, apiKey, ...safeConfig } = config as SupabaseConfig;
      return safeConfig;
    }
    return undefined;
  }
}

// Create singleton instance
const supabaseAdapter = new SupabaseAdapter();
export default supabaseAdapter;
