
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { MobileApp } from '@/components/mobile/MobileApp';
import { PhoneAuthScreen } from '@/components/auth/PhoneAuthScreen';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { useDispatch } from 'react-redux';
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
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);

  const handleAuthComplete = () => {
    dispatch(setOnboardingCompleted());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={
          isAuthenticated && onboardingCompleted ? 
            <Navigate to="/" replace /> : 
            <PhoneAuthScreen onComplete={handleAuthComplete} />
        } 
      />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <MobileApp />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <div className="App">
            <AppRoutes />
            <Toaster />
          </div>
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
