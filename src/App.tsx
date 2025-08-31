
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthenticatedProviders from "@/components/providers/AuthenticatedProviders";

// Import all pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import PredictiveInventory from "./pages/PredictiveInventory";

import Orders from "./pages/Orders";
import Clients from "./pages/Clients";
import VendorDatabase from "./pages/VendorDatabase";
import Locations from "./pages/Locations";
import Shipments from "./pages/Shipments";
import EmployeeManagement from "./pages/EmployeeManagement";
import Financial from "./pages/Financial";
import Billing from "./pages/Billing";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import IntegrationSettings from "./pages/IntegrationSettings";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

// Import metric detail pages
import WarehouseEfficiencyDetails from "./pages/metrics/WarehouseEfficiencyDetails";
import TaskCompletionDetails from "./pages/metrics/TaskCompletionDetails";
import OrderProcessingDetails from "./pages/metrics/OrderProcessingDetails";
import InventoryAccuracyDetails from "./pages/metrics/InventoryAccuracyDetails";
import MonthlyPerformanceMetricsDetails from "./pages/metrics/MonthlyPerformanceMetricsDetails";
import MonthlyOrderVolumeDetails from "./pages/metrics/MonthlyOrderVolumeDetails";

import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              } />
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
                <Route path="inventory" element={<Inventory />} />
                <Route path="predictive-inventory" element={<PredictiveInventory />} />
                <Route path="orders" element={<Orders />} />
                <Route path="clients" element={<Clients />} />
                <Route path="vendors" element={<VendorDatabase />} />
                <Route path="locations" element={<Locations />} />
                <Route path="shipments" element={<Shipments />} />
                <Route path="todos" element={<EmployeeManagement />} />
                <Route path="financial" element={<Financial />} />
                <Route path="billing" element={<Billing />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="integrations" element={<IntegrationSettings />} />
                
                {/* Metric detail routes */}
                <Route path="metrics/warehouse-efficiency" element={<WarehouseEfficiencyDetails />} />
                <Route path="metrics/task-completion" element={<TaskCompletionDetails />} />
                <Route path="metrics/order-processing" element={<OrderProcessingDetails />} />
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
    </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
