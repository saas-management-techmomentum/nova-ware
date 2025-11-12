
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthenticatedProviders from "@/components/providers/AuthenticatedProviders";

// Import all pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PredictiveInventory from "./pages/PredictiveInventory";

import VendorDatabase from "./pages/VendorDatabase";
import Billing from "./pages/Billing";
import IntegrationSettings from "./pages/IntegrationSettings";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

// Import metric detail pages
import WarehouseEfficiencyDetails from "./pages/metrics/WarehouseEfficiencyDetails";
import TaskCompletionDetails from "./pages/metrics/TaskCompletionDetails";
import InventoryAccuracyDetails from "./pages/metrics/InventoryAccuracyDetails";
import MonthlyPerformanceMetricsDetails from "./pages/metrics/MonthlyPerformanceMetricsDetails";
import MonthlyOrderVolumeDetails from "./pages/metrics/MonthlyOrderVolumeDetails";

import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<AboutPage />} />
              
              {/* Protected routes */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              
              {/* App routes with layout - wrapped in authenticated providers */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <AuthenticatedProviders>
                    <AppLayout />
                  </AuthenticatedProviders>
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="predictive-inventory" element={<PredictiveInventory />} />
                <Route path="vendors" element={<VendorDatabase />} />
                <Route path="billing" element={<Billing />} />
                <Route path="integrations" element={<IntegrationSettings />} />
                
                {/* Metric detail routes */}
                <Route path="metrics/warehouse-efficiency" element={<WarehouseEfficiencyDetails />} />
                <Route path="metrics/task-completion" element={<TaskCompletionDetails />} />
                <Route path="metrics/inventory-accuracy" element={<InventoryAccuracyDetails />} />
                <Route path="metrics/monthly-performance" element={<MonthlyPerformanceMetricsDetails />} />
                <Route path="metrics/monthly-orders" element={<MonthlyOrderVolumeDetails />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
