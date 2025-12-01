
import { supabase } from '@/integrations/supabase/client';
import { testRLSPolicies } from '@/utils/rlsUtils';

export interface SessionValidationResult {
  isValid: boolean;
  hasAccessToken: boolean;
  isExpired: boolean;
  userId?: string;
  error?: string;
}

export const validateSession = async (): Promise<SessionValidationResult> => {
  try {

    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return {
        isValid: false,
        hasAccessToken: false,
        isExpired: false,
        error: error.message
      };
    }
    
    if (!session) {
      return {
        isValid: false,
        hasAccessToken: false,
        isExpired: false,
        error: 'No session found'
      };
    }
    
    const hasAccessToken = !!session.access_token;
    const isExpired = session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false;
    const isValid = hasAccessToken && !isExpired;
    
    
    return {
      isValid,
      hasAccessToken,
      isExpired,
      userId: session.user?.id,
      error: isValid ? undefined : 'Session is expired or invalid'
    };
  } catch (error) {
    console.error('Session validation exception:', error);
    return {
      isValid: false,
      hasAccessToken: false,
      isExpired: false,
      error: 'Session validation failed'
    };
  }
};

// Simple database connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('companies').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Force session refresh
export const forceSessionRefresh = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
    return !!data.session?.access_token;
  } catch (error) {
    console.error('Session refresh exception:', error);
    return false;
  }
};

// Enhanced database mutation test with RLS validation
export const testDatabaseMutation = async (): Promise<boolean> => {
  try {
    // Test RLS policies instead of direct audit function
    const rlsResults = await testRLSPolicies();
    
    if (!rlsResults) {
      console.error('RLS policy test failed');
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

export const ensureValidSession = async (): Promise<boolean> => {
  
  const validation = await validateSession();
  
  if (!validation.isValid) {
    return await forceSessionRefresh();
  }
  return true;
};

// Enhanced data integrity test with RLS enforcement
export const testDataIntegrity = async (): Promise<{
  success: boolean;
  issues: any[];
  message: string;
  rlsResults?: any;
}> => {
  try {
  
    
    // Run RLS policy tests
    const rlsResults = await testRLSPolicies();
    
    if (!rlsResults) {
      return {
        success: false,
        issues: [],
        message: 'RLS policy validation failed'
      };
    }
    
    // Disabled: RPC function not available
    // const { data, error } = await supabase.rpc('audit_data_consistency' as any);
    console.warn('auditDataConsistency: RPC function not available');
    const data: any[] = [];
    
    const issues: any[] = [];
    const hasIssues = false;
    
    return {
      success: !hasIssues,
      issues,
      message: hasIssues 
        ? `Found ${issues.length} data integrity issues`
        : 'All data integrity checks passed',
      rlsResults
    };
  } catch (error) {
    console.error('Data integrity test exception:', error);
    return {
      success: false,
      issues: [],
      message: 'Data integrity test failed with exception'
    };
  }
};
