
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { MobileApp } from '@/components/mobile/MobileApp';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);

  // Always show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/onboarding" 
        element={
          isAuthenticated && onboardingCompleted ? 
            <Navigate to="/" replace /> : 
            <OnboardingFlow />
        } 
      />
      <Route 
        path="/*" 
        element={
          isAuthenticated && onboardingCompleted ? (
            <ProtectedRoute>
              <MobileApp />
            </ProtectedRoute>
          ) : (
            <Navigate to="/onboarding" replace />
          )
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrandingProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <div className="App">
              <AppRoutes />
              <Toaster />
            </div>
          </Suspense>
        </BrandingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
