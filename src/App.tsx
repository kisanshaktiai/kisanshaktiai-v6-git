
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { store } from './store';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layouts/AppShell';
import { DashboardHome } from './components/mobile/DashboardHome';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import i18n from './i18n';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <DashboardHome />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          !isAuthenticated ? (
            <OnboardingFlow />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>
              <Router>
                <AppShell>
                  <AppRoutes />
                </AppShell>
              </Router>
            </AuthProvider>
          </I18nextProvider>
        </Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
