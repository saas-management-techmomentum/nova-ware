import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// NOTE: profiles table not present in DB; using client-side placeholder
export interface Profile {
  id: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  onboarding_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_current_step: number;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // Create minimal client-side profile
    setProfile({
      id: user.id,
      onboarding_enabled: false,
      onboarding_completed: true,
      onboarding_current_step: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsLoading(false);
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { success: false, error: 'No profile' };
    
    setProfile(prev => prev ? { 
      ...prev, 
      ...updates, 
      updated_at: new Date().toISOString() 
    } : prev);
    
    return { success: true };
  };

  return {
    profile,
    isLoading,
    error: null,
    fetchProfile: async () => {},
    updateProfile,
  };
};
