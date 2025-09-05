
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { AppProviders } from '@/providers/AppProviders';
import { MobileApp } from '@/components';
import { ErrorBoundary } from '@/components';
import { Toaster } from './components/ui/sonner';
import { EnhancedSplashScreen } from '@/components/splash/EnhancedSplashScreen';
import './i18n';
import './App.css';

// Create a client with enhanced default settings for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - cache kept longer 
      retry: 2,
      refetchOnWindowFocus: true, // Refresh when user returns to tab
      refetchOnMount: 'always', // Always fetch fresh data on mount
      refetchInterval: 10 * 60 * 1000, // Background refresh every 10 minutes
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

function App() {
  const [initialized, setInitialized] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);

  const handleInitialization = (result: any) => {
    setInitResult(result);
    setInitialized(true);
    
    // Store tenant info in session storage for quick access
    if (result.tenant) {
      sessionStorage.setItem('current_tenant', JSON.stringify(result.tenant));
    }
    if (result.branding) {
      sessionStorage.setItem('tenant_branding', JSON.stringify(result.branding));
    }
  };

  // Show splash screen during initialization
  if (!initialized) {
    return <EnhancedSplashScreen onInitialized={handleInitialization} />;
  }

  return (
    <ErrorBoundary>
      <AppProviders queryClient={queryClient}>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route 
                path="/*" 
                element={<MobileApp />} 
              />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
