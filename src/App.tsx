
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './hooks/useAuth';
import { TenantProvider } from './context/TenantContext';
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
            <div className="min-h-screen bg-background">
              <Routes>
                <Route 
                  path="/*" 
                  element={<MobileApp />} 
                />
              </Routes>
              <Toaster />
            </div>
          </TenantProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
