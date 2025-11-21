
import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { usePagePermissions, PagePermissions } from '@/hooks/usePagePermissions';

interface OnboardingStep {
  id: number;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  pageKey?: keyof PagePermissions; // New field to map to page permissions
}

interface OnboardingContextType {
  isOnboardingEnabled: boolean;
  isOnboardingActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  onboardingCompleted: boolean;
  toggleOnboarding: () => Promise<void>;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const allOnboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to LogistiX WMS!",
    content: "Welcome to your comprehensive warehouse management system. This quick tour will help you understand all the key features and get you started with managing your operations efficiently.",
    position: 'bottom'
    // No pageKey - this step is always shown
  },
  {
    id: 2,
    title: "Dashboard Overview",
    content: "Your central command center providing real-time analytics, performance metrics, and key insights into your warehouse operations at a glance.",
    target: '[href="/app"]',
    position: 'right',
    pageKey: 'dashboard'
  },
  {
    id: 3,
    title: "Inventory Management",
    content: "Track your products, manage stock levels, monitor item quantities, and get real-time updates on inventory movement and availability across all locations.",
    target: '[href="/app/inventory"]',
    position: 'right',
    pageKey: 'inventory'
  },
  {
    id: 4,
    title: "Predictive Inventory",
    content: "Leverage AI-powered forecasting to predict inventory needs, optimize stock levels, and prevent stockouts before they happen with intelligent analytics.",
    target: '[href="/app/predictive-inventory"]',
    position: 'right',
    pageKey: 'predictive-inventory'
  },
  {
    id: 5,
    title: "Incoming Shipments",
    content: "Manage and track all incoming deliveries, coordinate receiving operations, and ensure smooth integration of new inventory into your warehouse system.",
    target: '[href="/app/shipments"]',
    position: 'right',
    pageKey: 'shipments'
  },
  {
    id: 6,
    title: "Order Management",
    content: "Process customer orders efficiently with our streamlined workflow system. Track orders from creation through fulfillment and delivery completion.",
    target: '[href="/app/orders"]',
    position: 'right',
    pageKey: 'orders'
  },
  {
    id: 7,
    title: "Product Locations",
    content: "Organize and track product placement throughout your warehouse. Manage storage locations, optimize space utilization, and maintain accurate location records.",
    target: '[href="/app/locations"]',
    position: 'right',
    pageKey: 'locations'
  },
  {
    id: 8,
    title: "Employee Management",
    content: "Coordinate your workforce effectively by managing tasks, tracking performance, assigning responsibilities, and monitoring team productivity.",
    target: '[href="/app/todos"]',
    position: 'right',
    pageKey: 'todos'
  },
  {
    id: 9,
    title: "Financial Management",
    content: "Monitor your business finances with comprehensive accounting features, invoicing, expense tracking, and detailed financial reporting capabilities.",
    target: '[href="/app/financial"]',
    position: 'right',
    pageKey: 'financial'
  },
  {
    id: 10,
    title: "System Integrations",
    content: "Connect your warehouse management system with external platforms, e-commerce sites, and third-party services to streamline operations.",
    target: '[href="/app/integrations"]',
    position: 'right',
    pageKey: 'integrations'
  },
  {
    id: 11,
    title: "Client Database",
    content: "Maintain comprehensive customer records, track client relationships, manage contact information, and analyze customer behavior patterns.",
    target: '[href="/app/clients"]',
    position: 'right',
    pageKey: 'clients'
  },
  {
    id: 12,
    title: "Vendor Database",
    content: "Manage your supplier relationships, track vendor performance, maintain contact details, and streamline procurement processes with organized vendor data.",
    target: '[href="/app/vendors"]',
    position: 'right',
    pageKey: 'vendors'
  }
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthReady } = useAuth();
  const { profile, updateProfile, isLoading: profileLoading } = useProfile();
  const { hasPageAccess, isLoading: permissionsLoading } = usePagePermissions();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Filter steps based on user permissions
  const filteredSteps = useMemo(() => {
    if (permissionsLoading) {
      // Return all steps while permissions are loading to prevent flickering
      return allOnboardingSteps;
    }

    const accessibleSteps = allOnboardingSteps.filter(step => {
      // Always include steps without pageKey (like welcome step)
      if (!step.pageKey) return true;
      
      // Include step only if user has access to the page
      return hasPageAccess(step.pageKey);
    });

    // Re-number steps sequentially
    return accessibleSteps.map((step, index) => ({
      ...step,
      id: index + 1
    }));
  }, [hasPageAccess, permissionsLoading]);

  console.log('Onboarding steps filtered:', {
    totalSteps: allOnboardingSteps.length,
    accessibleSteps: filteredSteps.length,
    stepTitles: filteredSteps.map(s => s.title),
    permissionsLoading
  });

  // Get onboarding state from profile
  const isOnboardingEnabled = profile?.onboarding_enabled || false;
  const onboardingCompleted = profile?.onboarding_completed || false;
  const isLoading = profileLoading || permissionsLoading;

  // Initialize current step from profile, but ensure it's within filtered steps range
  useEffect(() => {
    if (profile?.onboarding_current_step && filteredSteps.length > 0) {
      const maxStep = filteredSteps.length;
      const stepFromProfile = Math.min(profile.onboarding_current_step, maxStep);
      setCurrentStep(stepFromProfile);
    }
  }, [profile?.onboarding_current_step, filteredSteps.length]);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (profile && isOnboardingEnabled && !onboardingCompleted && !isOnboardingActive && filteredSteps.length > 0) {
      setIsOnboardingActive(true);
    }
  }, [profile, isOnboardingEnabled, onboardingCompleted, isOnboardingActive, filteredSteps.length]);

  const toggleOnboarding = async () => {
    const newEnabled = !isOnboardingEnabled;
    const result = await updateProfile({ onboarding_enabled: newEnabled });
    
    if (result?.success && !newEnabled) {
      setIsOnboardingActive(false);
    }
  };

  const startOnboarding = () => {
    if (isOnboardingEnabled && filteredSteps.length > 0) {
      setCurrentStep(1);
      setIsOnboardingActive(true);
      updateProfile({ onboarding_current_step: 1 });
    }
  };

  const nextStep = () => {
    if (currentStep < filteredSteps.length) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateProfile({ onboarding_current_step: newStep });
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateProfile({ onboarding_current_step: newStep });
    }
  };

  const skipOnboarding = async () => {
    setIsOnboardingActive(false);
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setIsOnboardingActive(false);
    await updateProfile({ 
      onboarding_completed: true,
      onboarding_current_step: filteredSteps.length 
    });
  };

  const value = {
    isOnboardingEnabled,
    isOnboardingActive,
    currentStep,
    steps: filteredSteps, // Use filtered steps instead of all steps
    onboardingCompleted,
    toggleOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
