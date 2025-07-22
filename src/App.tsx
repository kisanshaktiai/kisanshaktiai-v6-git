
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { MobileApp } from "@/components/mobile/MobileApp";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import "./App.css";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            {/* Auth/Onboarding Route */}
            <Route 
              path="/auth" 
              element={
                isAuthenticated && onboardingCompleted ? (
                  <Navigate to="/app" replace />
                ) : (
                  <OnboardingFlow />
                )
              } 
            />
            
            {/* Main App Route */}
            <Route 
              path="/app/*" 
              element={
                isAuthenticated && onboardingCompleted ? (
                  <MobileApp />
                ) : (
                  <Navigate to="/auth" replace />
                )
              } 
            />
            
            {/* Root redirect */}
            <Route 
              path="/" 
              element={
                isAuthenticated && onboardingCompleted ? (
                  <Navigate to="/app" replace />
                ) : (
                  <Navigate to="/auth" replace />
                )
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
