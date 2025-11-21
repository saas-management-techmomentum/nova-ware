import React, { useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingTriggerProps {
  triggerOn?: 'page-load' | 'first-visit';
  delay?: number;
}

export const OnboardingTrigger: React.FC<OnboardingTriggerProps> = ({ 
  triggerOn = 'page-load', 
  delay = 1000 
}) => {
  const { isOnboardingEnabled, isOnboardingActive, onboardingCompleted, startOnboarding } = useOnboarding();
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || !user || isOnboardingActive || onboardingCompleted || !isOnboardingEnabled) {
      return;
    }

    const shouldTrigger = triggerOn === 'page-load' || 
      (triggerOn === 'first-visit' && !localStorage.getItem('onboarding-visited'));

    if (shouldTrigger) {
      const timer = setTimeout(() => {
        startOnboarding();
        if (triggerOn === 'first-visit') {
          localStorage.setItem('onboarding-visited', 'true');
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isAuthReady, user, isOnboardingActive, onboardingCompleted, isOnboardingEnabled, startOnboarding, triggerOn, delay]);

  return null;
};