// NOTE: profiles table not present in DB; this hook uses client-side placeholder state only.
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
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
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Set client-side default profile
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
    if (!profile) return { success: false };

    setProfile(prev => prev ? {
      ...prev,
      ...updates,
      updated_at: new Date().toISOString(),
    } : prev);

    return { success: true };
  };

  const fetchProfile = async () => {
    // No-op since we use client-side state only
  };

  return {
    profile,
    isLoading,
    error: null,
    fetchProfile,
    updateProfile,
  };
};
