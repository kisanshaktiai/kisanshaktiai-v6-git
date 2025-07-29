import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class TenantErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Tenant Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error details for debugging
    this.logErrorDetails(error, errorInfo);
  }

  componentWillUnmount() {
    // Clear any pending retries
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  private logErrorDetails = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.state.retryCount,
    };

    console.group('🚨 Tenant Error Details');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error Data:', errorData);
    console.groupEnd();

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // errorReportingService.captureException(error, { extra: errorData });
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.warn('🔄 Maximum retry attempts reached');
      return;
    }

    console.log(`🔄 Retrying... Attempt ${retryCount + 1}/${this.maxRetries}`);
    
    // Clear the error state with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
      this.retryTimeouts.delete(timeout);
    }, delay);
    
    this.retryTimeouts.add(timeout);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderErrorUI = () => {
    const { error, retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p>We encountered an unexpected error while loading your tenant data.</p>
              {error && (
                <details className="mt-2 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
                </Button>
              )}
              
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            {!canRetry && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Maximum retry attempts reached. Please reload the page or contact support if the problem persists.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}