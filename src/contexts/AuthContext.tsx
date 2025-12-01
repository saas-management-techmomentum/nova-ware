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

      const { data, error } = await supabase.rpc('user_needs_password_change');
      
      if (error) {
        console.error('Error checking password change status:', error);
        setNeedsPasswordChange(false);
      } else {
        setNeedsPasswordChange(data || false);
      }
    } catch (error) {
      console.error('Error in checkPasswordChangeStatus:', error);
      setNeedsPasswordChange(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user as AuthUser);
        }
      } else {
        setSession(data.session);
        setUser(data.session?.user as AuthUser ?? null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const fetchEmployeeData = async (userId: string) => {
    try {
      
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
    try {
      await refreshSession();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user && currentSession.access_token) {
        setSession(currentSession);
        setUser(currentSession.user as AuthUser);
        
        // Parallelize all three queries for faster loading
        await Promise.all([
          fetchUserRole(currentSession.user.id),
          checkPasswordChangeStatus(currentSession.user.id),
          fetchEmployeeData(currentSession.user.id)
        ]);
      } else {
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
    
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        console.error('No valid session available for role fetch');
        setUserRole(null);
        setIsUserAdmin(false);
        return;
      }
      
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
      
      
      if (roleData && roleData.length > 0) {
        const adminRole = roleData.find(entry => entry.role === 'admin');
        const primaryRole = adminRole ? 'admin' : roleData[0].role;
        
        setUserRole(primaryRole);
        setIsUserAdmin(!!adminRole);
      } else {
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
    
    
    try {
      const companyName = user.user_metadata?.company_name;
      if (!companyName) {
        console.error('No company name found in user metadata');
        return;
      }

      
      const { data, error } = await supabase.rpc('complete_user_setup', {
        target_user_id: user.id,
        company_name: companyName
      });
      
      if (error) {
        console.error('Error completing user setup:', error);
        throw error;
      }

      
      const result = data as unknown as FixSetupResponse;
      
      if (result?.success) {
        await fetchUserRole(user.id);
      } else {
        console.error('Failed to complete setup:', result?.error);
        throw new Error(result?.error || 'Failed to complete user setup');
      }
    } catch (error) {
      console.error('Error in completeUserSetup:', error);
      throw error;
    }
  };

  const fixIncompleteSetup = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('fix_incomplete_user_setup', {
        target_user_id: user.id
      });
      
      if (error) {
        console.error('Error fixing incomplete setup:', error);
        throw error;
      }
      
      
      const result = data as unknown as FixSetupResponse;
      
      if (result?.success) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user as AuthUser ?? null);
        
        if (session?.user && session.access_token) {
          setTimeout(() => {
            if (mounted) {
              
              // Parallelize all three queries for faster loading
              Promise.all([
                fetchUserRole(session.user.id),
                checkPasswordChangeStatus(session.user.id),
                fetchEmployeeData(session.user.id)
              ]).catch(error => {
                console.error('Error fetching user data:', error);
              });
              
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          
          setSession(session);
          setUser(session?.user as AuthUser ?? null);
          
          if (session?.user && session.access_token) {
            
            // Parallelize all three queries for faster loading
            await Promise.all([
              fetchUserRole(session.user.id),
              checkPasswordChangeStatus(session.user.id),
              fetchEmployeeData(session.user.id)
            ]);
            
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


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
