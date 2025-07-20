
import React, { ComponentType } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface WithErrorBoundaryOptions {
  level?: 'page' | 'component' | 'critical';
  fallback?: React.ReactNode;
}

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary level={options.level} fallback={options.fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
