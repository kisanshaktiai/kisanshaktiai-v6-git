
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './hooks/useAuth';
import { TenantProvider } from './context/TenantContext';
import { ProfileCompletionGuard } from './components/common/ProfileCompletionGuard';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { MobileApp } from './components/mobile/MobileApp';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import './i18n';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <TenantProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route 
                    path="/onboarding" 
                    element={<OnboardingFlow />} 
                  />
                  <Route 
                    path="/*" 
                    element={
                      <ProfileCompletionGuard>
                        <MobileApp />
                      </ProfileCompletionGuard>
                    } 
                  />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </TenantProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
