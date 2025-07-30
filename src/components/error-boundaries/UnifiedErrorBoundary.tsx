
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppError, ErrorBoundaryState, ErrorRecoveryOptions, ErrorLevel, createError } from '@/types/errors';

interface UnifiedErrorBoundaryProps extends ErrorRecoveryOptions {
  children: ReactNode;
  level: ErrorLevel;
  context?: string;
}

export class UnifiedErrorBoundary extends Component<UnifiedErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(props: UnifiedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: createError('REACT_ERROR', error.message)
        .withDetails({ stack: error.stack })
        .build(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createError('REACT_ERROR', error.message)
      .withDetails({ 
        stack: error.stack, 
        componentStack: errorInfo.componentStack 
      })
      .withContext({ 
        component: this.props.context,
        page: window.location.pathname 
      })
      .build();

    this.setState({ error: appError });
    this.props.onError?.(appError);

    console.error('🚨 Unified Error Boundary caught error:', {
      error,
      errorInfo,
      context: this.props.context,
      level: this.props.level,
    });
  }

  componentWillUnmount() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries ?? 3;
    const retryDelay = this.props.retryDelay ?? 1000;

    if (this.state.retryCount >= maxRetries) return;

    const delay = Math.min(retryDelay * Math.pow(2, this.state.retryCount), 10000);
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        lastRetryAt: Date.now(),
      }));
      
      this.props.onRetry?.();
      this.retryTimeouts.delete(timeout);
    }, delay);
    
    this.retryTimeouts.add(timeout);
  };

  private renderError(): ReactNode {
    const { level, fallbackComponent: FallbackComponent } = this.props;
    const { error, retryCount } = this.state;
    const maxRetries = this.props.maxRetries ?? 3;
    const canRetry = retryCount < maxRetries;

    if (FallbackComponent) {
      return <FallbackComponent error={error} onRetry={canRetry ? this.handleRetry : undefined} />;
    }

    switch (level) {
      case 'critical':
        return this.renderCriticalError();
      case 'page':
        return this.renderPageError();
      case 'component':
      default:
        return this.renderComponentError();
    }
  }

  private renderComponentError(): ReactNode {
    const { error, retryCount } = this.state;
    const maxRetries = this.props.maxRetries ?? 3;
    const canRetry = retryCount < maxRetries;
    
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-destructive">
              Component Error
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || 'An unexpected error occurred'}
            </p>
            {canRetry && (
              <Button
                onClick={this.handleRetry}
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry ({maxRetries - retryCount} left)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  private renderPageError(): ReactNode {
    const { error, retryCount } = this.state;
    const maxRetries = this.props.maxRetries ?? 3;
    const canRetry = retryCount < maxRetries;
    
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">Page Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              {error?.message || 'Failed to load this page'}
            </p>
            <div className="flex flex-col space-y-2">
              {canRetry && (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderCriticalError(): ReactNode {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Critical Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              A critical error has occurred. Please reload the application.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderError();
    }

    return this.props.children;
  }
}
