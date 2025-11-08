
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 to-slate-900">
        {/* Improved background elements */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle glow effects */}
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-slate-700/10 rounded-full blur-3xl transform -translate-y-1/3 translate-x-1/4 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-slate-700/10 rounded-full blur-3xl transform translate-y-1/3 -translate-x-1/4 opacity-30"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl opacity-20"></div>
          
          {/* Grid overlay - subtle and elegant */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-[0.03]"></div>
          
          {/* Horizontal lines */}
          <div className="absolute inset-0">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-600/10 to-transparent absolute top-1/4"></div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-600/7 to-transparent absolute top-2/4"></div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-600/10 to-transparent absolute top-3/4"></div>
          </div>
        </div>
        
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
