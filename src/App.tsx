
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { Toaster } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { MobileApp } from '@/components/mobile/MobileApp';
import { useTenantContext } from '@/hooks/useTenantContext';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const AppContent: React.FC = () => {
  const { tenantData, loading, error } = useTenantContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading KisanShakti AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center space-y-4 p-6">
          <h2 className="text-xl font-semibold text-red-800">Error Loading App</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Apply tenant branding to document
  React.useEffect(() => {
    if (tenantData?.branding) {
      document.title = tenantData.branding.app_name || 'KisanShakti AI';
      
      // Set CSS custom properties for theming
      const root = document.documentElement;
      root.style.setProperty('--primary-color', tenantData.branding.primary_color || '#8BC34A');
      root.style.setProperty('--secondary-color', tenantData.branding.secondary_color || '#4CAF50');
      root.style.setProperty('--accent-color', tenantData.branding.accent_color || '#689F38');
    }
  }, [tenantData]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/*" element={<MobileApp />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <AppContent />
          </Suspense>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
