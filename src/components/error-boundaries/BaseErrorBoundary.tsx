
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode | ((props: { hasError: boolean; error: Error | null; onRetry: () => void }) => ReactNode);
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class BaseErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
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
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));

    this.props.onRetry?.();
  };

  private renderError(): ReactNode {
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { error, retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;

    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-destructive">
              Something went wrong
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex space-x-2 mt-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
                </Button>
              )}
              <Button
                onClick={() => window.location.href = '/'}
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
              >
                <Home className="w-3 h-3 mr-1" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { children } = this.props;
    const { hasError, error } = this.state;

    // Support render props pattern
    if (typeof children === 'function') {
      return children({
        hasError,
        error,
        onRetry: this.handleRetry,
      });
    }

    // Standard error boundary behavior
    if (hasError) {
      return this.renderError();
    }

    return children;
  }
}
