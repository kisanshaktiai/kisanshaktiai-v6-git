import React, { Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isCollapsed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isCollapsed: true,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      isCollapsed: true,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Generate unique error ID for tracking
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({ 
      error, 
      errorInfo,
      errorId 
    });

    // Log error to Supabase for monitoring
    this.logErrorToSupabase(error, errorInfo, errorId);
    
    // Send telemetry data
    this.sendTelemetry(error, errorInfo, errorId);
  }

  private async logErrorToSupabase(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const errorData = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_boundary_level: this.props.level || 'component',
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
      };

      // Insert error log via edge function to avoid RLS issues
      await supabase.functions.invoke('log-error', {
        body: errorData
      });

      console.log(`Error logged to Supabase with ID: ${errorId}`);
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }
  }

  private sendTelemetry(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      // Send basic telemetry data (you could integrate with services like Sentry, LogRocket, etc.)
      const telemetryData = {
        errorId,
        errorMessage: error.message,
        errorName: error.name,
        level: this.props.level || 'component',
        componentStack: errorInfo.componentStack?.split('\n')[1]?.trim(), // First component in stack
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // For now, just log to console - in production, send to your telemetry service
      console.log('Error Telemetry:', telemetryData);
      
      // You could send to external services here:
      // window.gtag?.('event', 'exception', { description: error.message, fatal: false });
      // Sentry.captureException(error, { contexts: { errorBoundary: telemetryData } });
    } catch (telemetryError) {
      console.error('Failed to send telemetry:', telemetryError);
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  private toggleDetails = () => {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  };

  private renderFallbackUI() {
    const { level = 'component' } = this.props;
    const { error, errorInfo, errorId, isCollapsed } = this.state;

    // Critical level errors (app-wide)
    if (level === 'critical') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Application Error</CardTitle>
              <CardDescription>
                A critical error occurred that prevented the application from loading properly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Error ID: <code className="bg-muted px-1 rounded text-xs">{errorId}</code>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRefresh} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Application
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full" onClick={this.toggleDetails}>
                    <Bug className="mr-2 h-4 w-4" />
                    {isCollapsed ? 'Show' : 'Hide'} Error Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-32">
                    <div className="font-semibold text-destructive mb-2">{error?.name}: {error?.message}</div>
                    <div className="text-muted-foreground">{error?.stack}</div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Page level errors
    if (level === 'page') {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle>Page Error</CardTitle>
              <CardDescription>
                This page encountered an error and couldn't load properly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Error ID: <code className="bg-muted px-1 rounded text-xs">{errorId}</code>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <Bug className="mr-2 h-4 w-4" />
                    {isCollapsed ? 'Show' : 'Hide'} Technical Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-32">
                    <div className="font-semibold text-destructive mb-1">{error?.message}</div>
                    <div className="text-muted-foreground text-xs">{errorInfo?.componentStack?.split('\n')[1]?.trim()}</div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Component level errors (minimal UI)
    return (
      <div className="flex items-center justify-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Component Error</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This component failed to load. Error ID: {errorId}
          </p>
          <Button onClick={this.handleRetry} size="sm" variant="outline">
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use our built-in fallback UI
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}
