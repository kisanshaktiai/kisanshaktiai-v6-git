import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { setLoading, setCurrentTenant, setTenantBranding } from '@/store/slices/tenantSlice';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Emergency fallback tenant
const EMERGENCY_TENANT = {
  id: 'emergency-tenant',
  name: 'KisanShakti AI',
  slug: 'emergency',
  type: 'default',
  status: 'active',
  branding_version: 1,
  branding_updated_at: new Date().toISOString()
};

const EMERGENCY_BRANDING = {
  app_name: 'KisanShakti AI',
  app_tagline: 'Your smart farming journey starts here',
  primary_color: '#8BC34A',
  secondary_color: '#4CAF50',
  background_color: '#FFFFFF',
  accent_color: '#FF9800',
  text_color: '#1F2937',
  logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  version: 1
};

export class TenantErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tenant Error Boundary caught error:', error, errorInfo);
    
    // Try to recover by setting emergency tenant
    this.recoverWithEmergencyTenant();
  }

  private recoverWithEmergencyTenant = () => {
    try {
      // Get the store and dispatch emergency tenant
      const store = (window as any).__REDUX_STORE__;
      if (store) {
        store.dispatch(setLoading(false));
        store.dispatch(setCurrentTenant(EMERGENCY_TENANT));
        store.dispatch(setTenantBranding(EMERGENCY_BRANDING));
      }
    } catch (recoveryError) {
      console.error('Failed to recover with emergency tenant:', recoveryError);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Loading Error
              </h1>
              <p className="text-muted-foreground mb-6">
                We're having trouble loading your dashboard. Don't worry, we'll get you back on track.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  this.recoverWithEmergencyTenant();
                  window.location.reload();
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => {
                  this.recoverWithEmergencyTenant();
                  this.setState({ hasError: false });
                }}
                className="w-full bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Continue with Basic Mode
              </button>
            </div>
            
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded text-muted-foreground overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const TenantErrorFallback: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <TenantErrorBoundary>{children}</TenantErrorBoundary>;
};