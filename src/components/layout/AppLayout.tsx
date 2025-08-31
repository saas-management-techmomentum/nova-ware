
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full professional-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto bg-muted/20">
            <div className="w-full relative">
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
