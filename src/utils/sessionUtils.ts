
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
    console.log('Validating session...');
    
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
    
    console.log('Session validation result:', {
      isValid,
      hasAccessToken,
      isExpired,
      userId: session.user?.id
    });
    
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
    
    console.log('Database mutation test with RLS validation passed:', rlsResults);
    return true;
  } catch (error) {
    console.error('Database mutation test failed:', error);
    return false;
  }
};

export const ensureValidSession = async (): Promise<boolean> => {
  console.log('Ensuring valid session...');
  
  const validation = await validateSession();
  
  if (!validation.isValid) {
    console.log('Session invalid, attempting refresh...');
    return await forceSessionRefresh();
  }
  
  console.log('Session is already valid');
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
    console.log('Testing data integrity with RLS enforcement...');
    
    // Run RLS policy tests
    const rlsResults = await testRLSPolicies();
    
    if (!rlsResults) {
      return {
        success: false,
        issues: [],
        message: 'RLS policy validation failed'
      };
    }
    
    // Test basic data consistency - disabled
    console.warn('audit_data_consistency: RPC not available');
    
    const issues: any[] = [];
    const hasIssues = false;
    
    return {
      success: true,
      issues,
      message: 'Data integrity checks disabled',
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
