
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { I18nextProvider } from 'react-i18next';
import { store, persistor } from './store';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MobileApp } from './components/mobile/MobileApp';
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

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
            <I18nextProvider i18n={i18n}>
              <AuthProvider>
                <Router>
                  <Routes>
                    <Route path="/*" element={<MobileApp />} />
                  </Routes>
                </Router>
              </AuthProvider>
            </I18nextProvider>
          </PersistGate>
        </Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
