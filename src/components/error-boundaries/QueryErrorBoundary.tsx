import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  context?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class QueryErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 Query Error Boundary (${this.props.context || 'unknown'}) caught an error:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    this.props.onError?.(error, errorInfo);

    // Auto-retry for certain error types
    this.handleAutoRetry(error);
  }

  private handleAutoRetry = (error: Error) => {
    // Auto-retry for network errors or temporary failures
    const isRetryableError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.name === 'AbortError';

    if (isRetryableError && this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.handleRetry();
      }, 1000 * (this.state.retryCount + 1)); // Exponential backoff
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });
    
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
      
      this.props.onRetry?.();
    }, 500);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderComponentError = () => {
    const { error, retryCount, isRetrying } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-destructive">
              Failed to load {this.props.context || 'component'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || 'An unexpected error occurred'}
            </p>
            {canRetry && (
              <Button
                onClick={this.handleRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  private renderPageError = () => {
    const { error, retryCount, isRetrying } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">
              Failed to load {this.props.context || 'page'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground text-sm">
              <p>{error?.message || 'An unexpected error occurred while loading this page.'}</p>
            </div>
            
            <div className="flex flex-col space-y-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="w-full"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                onClick={this.handleGoHome}
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
  };

  private renderCriticalError = () => {
    const { error } = this.state;
    
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
            <div className="text-center text-muted-foreground">
              <p>A critical error has occurred that prevents the application from functioning properly.</p>
              {error && (
                <details className="mt-3 text-left">
                  <summary className="cursor-pointer text-sm hover:text-foreground">
                    Error details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
            </div>
            
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
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Render based on error level
      switch (this.props.level) {
        case 'critical':
          return this.renderCriticalError();
        case 'page':
          return this.renderPageError();
        case 'component':
        default:
          return this.renderComponentError();
      }
    }

    return this.props.children;
  }
}