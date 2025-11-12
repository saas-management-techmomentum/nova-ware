import { useState } from 'react';

export interface Profile {
  id: string;
  avatar_url?: string;
  bio?: string;
  onboarding_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_current_step: number;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    console.warn('fetchProfile not yet implemented');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    console.warn('updateProfile not yet implemented');
    return { success: true };
  };

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  };
};
