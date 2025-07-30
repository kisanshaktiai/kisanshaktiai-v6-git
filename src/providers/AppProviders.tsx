
import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store';
import { AuthProvider } from '@/hooks/useAuth';
import { TenantProvider } from '@/context/TenantContext';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { StateManager } from '@/store/services/StateManager';

interface AppProvidersProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

/**
 * Centralized provider hierarchy with clear dependencies
 * Order matters: Redux -> QueryClient -> Auth -> Tenant -> Language
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children, queryClient }) => {
  // Initialize state coordination
  React.useEffect(() => {
    const stateManager = StateManager.getInstance();
    stateManager.setQueryClient(queryClient);
  }, [queryClient]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TenantProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </TenantProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
};
