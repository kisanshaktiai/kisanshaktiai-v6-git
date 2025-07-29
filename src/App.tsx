
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { AuthProvider } from './hooks/useAuth';
import { TenantProvider } from './context/TenantContext';
import { LanguageProvider } from './components/providers/LanguageProvider';
import { MobileApp } from './components/mobile/MobileApp';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
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
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TenantProvider>
              <LanguageProvider>
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
              </LanguageProvider>
            </TenantProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
