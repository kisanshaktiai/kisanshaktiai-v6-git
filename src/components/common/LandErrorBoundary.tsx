import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRetrying: boolean;
}

export class LandErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isRetrying: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Land management error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) return;
    
    this.setState({ isRetrying: true });
    this.retryCount++;

    // Wait for retry delay with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));

    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      isRetrying: false 
    });
  };

  private getErrorType() {
    const error = this.state.error;
    if (!error) return 'unknown';
    
    if (error.message.includes('Network')) return 'network';
    if (error.message.includes('GPS') || error.message.includes('Geolocation')) return 'location';
    if (error.message.includes('Maps') || error.message.includes('API')) return 'maps';
    return 'general';
  }

  private renderErrorContent() {
    const errorType = this.getErrorType();
    const canRetry = this.retryCount < this.maxRetries;

    const errorConfig = {
      network: {
        icon: WifiOff,
        title: 'Connection Issue',
        message: 'Unable to connect to our servers. Please check your internet connection.',
        suggestion: 'Your land data is saved locally and will sync when connection is restored.',
      },
      location: {
        icon: AlertTriangle,
        title: 'Location Access Required',
        message: 'GPS access is needed to mark land boundaries accurately.',
        suggestion: 'Please enable location permissions in your browser settings.',
      },
      maps: {
        icon: AlertTriangle,
        title: 'Map Loading Error',
        message: 'Unable to load the map interface.',
        suggestion: 'This might be a temporary issue. Please try again.',
      },
      general: {
        icon: AlertTriangle,
        title: 'Something went wrong',
        message: 'An unexpected error occurred while managing your land data.',
        suggestion: 'Your data is safe. Please try refreshing the page.',
      },
    };

    const config = errorConfig[errorType as keyof typeof errorConfig];
    const Icon = config.icon;

    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{config.message}</p>
          <p className="text-sm text-muted-foreground">{config.suggestion}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {canRetry && (
              <Button 
                onClick={this.handleRetry} 
                disabled={this.state.isRetrying}
                variant="default"
                size="sm"
              >
                {this.state.isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </>
                )}
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
            >
              Refresh Page
            </Button>
          </div>

          {this.retryCount >= this.maxRetries && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {this.renderErrorContent()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}