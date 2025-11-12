import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser extends Omit<User, 'user_metadata'> {
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    company_name?: string;
    employee_name?: string;
  };
}

interface EmployeeData {
  id: string;
  name: string;
  email?: string;
  position?: string;
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  employee: EmployeeData | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, companyName: string, invitationCode: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthReady: boolean;
  userRole: string | null;
  isUserAdmin: boolean;
  refreshSession: () => Promise<void>;
  forceRefreshAuth: () => Promise<void>;
  completeUserSetup: () => Promise<void>;
  fixIncompleteSetup: () => Promise<void>;
  needsPasswordChange: boolean | null;
}

interface FixSetupResponse {
  success: boolean;
  error?: string;
  company_id?: string;
  company_name?: string;
  message?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState<boolean | null>(null);

  const checkPasswordChangeStatus = async (userId: string) => {
    try {
      console.log('Checking password change status for user:', userId);
      
      const { data, error } = await supabase.rpc('user_needs_password_change', {
        user_uuid: userId
      });
      
      if (error) {
        console.error('Error checking password change status:', error);
        setNeedsPasswordChange(false);
      } else {
        console.log('Password change status:', data);
        setNeedsPasswordChange(data || false);
      }
    } catch (error) {
      console.error('Error in checkPasswordChangeStatus:', error);
      setNeedsPasswordChange(false);
    }
  };

  const refreshSession = async () => {
    console.log('Manually refreshing session...');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user as AuthUser);
          console.log('Fallback: Using existing session');
        }
      } else {
        console.log('Session refreshed successfully:', data.session?.user?.id);
        setSession(data.session);
        setUser(data.session?.user as AuthUser ?? null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const fetchEmployeeData = async (userId: string) => {
    try {
      console.log('Fetching employee data for user:', userId);
      
      const { data: employeeData, error } = await supabase
        .from('employees')
        .select('id, name, email, position, department')
        .eq('user_id_auth', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching employee data:', error);
        }
        setEmployee(null);
        return;
      }
      
      if (employeeData) {
        console.log('Employee data found:', employeeData);
        setEmployee({
          id: employeeData.id,
          name: employeeData.name,
          email: employeeData.email,
          position: employeeData.position,
          department: employeeData.department,
        });
        
        if (user) {
          setUser({
            ...user,
            user_metadata: {
              ...user.user_metadata,
              employee_name: employeeData.name
            }
          });
        }
      } else {
        setEmployee(null);
      }
    } catch (error) {
      console.error('Error in fetchEmployeeData:', error);
      setEmployee(null);
    }
  };

  const forceRefreshAuth = async () => {
    console.log('Force refreshing authentication state...');
    try {
      await refreshSession();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user && currentSession.access_token) {
        console.log('Current user after force refresh:', currentSession.user.id);
        setSession(currentSession);
        setUser(currentSession.user as AuthUser);
        await fetchUserRole(currentSession.user.id);
        await checkPasswordChangeStatus(currentSession.user.id);
        await fetchEmployeeData(currentSession.user.id);
      } else {
        console.log('No valid session found after force refresh');
        setUserRole(null);
        setIsUserAdmin(false);
        setNeedsPasswordChange(null);
        setEmployee(null);
      }
    } catch (error) {
      console.error('Error in force refresh auth:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for:', userId);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        console.error('No valid session available for role fetch');
        setUserRole(null);
        setIsUserAdmin(false);
        return;
      }
      
      console.log('Making role fetch request with valid session');
      const { data: roleData, error } = await supabase
        .from('company_users')
        .select('role, company_id')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setIsUserAdmin(false);
        return;
      }
      
      console.log('Raw role data from database:', roleData);
      
      if (roleData && roleData.length > 0) {
        const adminRole = roleData.find(entry => entry.role === 'admin');
        const primaryRole = adminRole ? 'admin' : roleData[0].role;
        
        console.log('User role determined:', primaryRole);
        console.log('Is admin:', !!adminRole);
        
        setUserRole(primaryRole);
        setIsUserAdmin(!!adminRole);
      } else {
        console.log('No role data found for user');
        setUserRole(null);
        setIsUserAdmin(false);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole(null);
      setIsUserAdmin(false);
    }
  };

  const completeUserSetup = async () => {
    if (!user) return;
    
    console.log('Completing user setup for:', user.id);
    
    try {
      const { data: existingRole } = await supabase
        .from('company_users')
        .select('role, company_id')
        .eq('user_id', user.id)
        .single();
      
      if (existingRole) {
        console.log('User already has company assignment');
        await fetchUserRole(user.id);
        return;
      }
      
      const companyName = user.user_metadata?.company_name;
      if (!companyName) {
        console.error('No company name found in user metadata');
        return;
      }
      
      console.log('Creating company and assigning admin role...');
      
      let company;
      try {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', companyName)
          .single();

        if (existingCompany) {
          company = existingCompany;
          console.log('Found existing company:', company.id);
        } else {
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert([{ name: companyName }])
            .select('id')
            .single();
          
          if (companyError) {
            if (companyError.code === '23505') {
              console.log('Company already exists, fetching existing company');
              const { data: retryCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('name', companyName)
                .single();
              company = retryCompany;
            } else {
              throw companyError;
            }
          } else {
            company = newCompany;
          }
          console.log('Created/found company:', company?.id);
        }
      } catch (companyError) {
        console.error('Error handling company creation:', companyError);
        throw companyError;
      }

      if (!company?.id) {
        throw new Error('Failed to create or find company');
      }

      try {
        const { error: roleError } = await supabase
          .from('company_users')
          .insert([{ 
            user_id: user.id, 
            role: 'admin',
            company_id: company.id
          }]);

        if (roleError && roleError.code !== '23505') {
          throw roleError;
        }
        
        console.log('Admin role assigned successfully');
      } catch (roleError) {
        console.error('Error assigning admin role:', roleError);
        throw roleError;
      }
      
      await fetchUserRole(user.id);
      
    } catch (error) {
      console.error('Error completing user setup:', error);
      throw error;
    }
  };

  const fixIncompleteSetup = async () => {
    if (!user) return;
    
    console.log('Attempting to fix incomplete setup for user:', user.id);
    
    try {
      const { data, error } = await supabase.rpc('fix_incomplete_user_setup', {
        target_user_id: user.id
      });
      
      if (error) {
        console.error('Error fixing incomplete setup:', error);
        throw error;
      }
      
      console.log('Fix incomplete setup result:', data);
      
      const result = data as unknown as FixSetupResponse;
      
      if (result?.success) {
        console.log('Setup fixed successfully, refreshing user role');
        await fetchUserRole(user.id);
      } else {
        console.error('Failed to fix setup:', result?.error);
        throw new Error(result?.error || 'Failed to fix incomplete setup');
      }
    } catch (error) {
      console.error('Error in fixIncompleteSetup:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
  };

  useEffect(() => {
    let mounted = true;

    console.log('AuthProvider initializing...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user as AuthUser ?? null);
        
        if (session?.user && session.access_token) {
          setTimeout(() => {
            if (mounted) {
              console.log('Fetching user role, password status, and employee data after auth state change');
              fetchUserRole(session.user.id);
              checkPasswordChangeStatus(session.user.id);
              fetchEmployeeData(session.user.id);
              
              if (event === 'SIGNED_IN') {
                setTimeout(() => {
                  completeUserSetup().catch(error => {
                    console.error('Auto-complete setup failed:', error);
                  });
                }, 1000);
              }
            }
          }, 300);
        } else {
          setUserRole(null);
          setIsUserAdmin(false);
          setNeedsPasswordChange(null);
          setEmployee(null);
        }
        
        setIsAuthReady(true);
      }
    );

    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          console.log('Initial session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            hasAccessToken: !!session?.access_token,
            userId: session?.user?.id
          });
          
          setSession(session);
          setUser(session?.user as AuthUser ?? null);
          
          if (session?.user && session.access_token) {
            console.log('Fetching user role, password status, and employee data for initial session');
            await fetchUserRole(session.user.id);
            await checkPasswordChangeStatus(session.user.id);
            await fetchEmployeeData(session.user.id);
            
            setTimeout(() => {
              completeUserSetup().catch(error => {
                console.error('Initial setup completion failed:', error);
              });
            }, 500);
          }
          
          setIsAuthReady(true);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setIsAuthReady(true);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('AuthProvider cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, companyName: string, invitationCode: string) => {
    // First validate the invitation code
    const { data: validationResult, error: validationError } = await supabase.functions.invoke('validate-invitation-code', {
      body: { invitationCode }
    });

    if (validationError) {
      throw new Error('Failed to validate invitation code. Please try again.');
    }

    if (!validationResult?.success) {
      throw new Error(validationResult?.error || 'Invalid invitation code');
    }

    // If invitation code is valid, proceed with signup
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
        },
        emailRedirectTo: redirectUrl
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user...');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    setTimeout(() => {
      forceRefreshAuth();
    }, 500);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    employee,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthReady,
    userRole,
    isUserAdmin,
    refreshSession,
    forceRefreshAuth,
    completeUserSetup,
    fixIncompleteSetup,
    needsPasswordChange,
  };

  console.log('AuthProvider rendering with state:', {
    isAuthReady,
    hasUser: !!user,
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    hasEmployee: !!employee,
    employeeName: employee?.name,
    userRole,
    isUserAdmin,
    needsPasswordChange
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
