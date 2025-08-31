
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground';

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full fintech-gradient-bg">
        <AnimatedBackground />
        
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto">
            <div className="w-full relative z-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <OnboardingModal />
    </SidebarProvider>
  );
};

export default AppLayout;
