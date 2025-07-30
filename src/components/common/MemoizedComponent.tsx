
import React, { memo, ReactNode } from 'react';

interface MemoizedComponentProps {
  children: ReactNode;
  deps?: unknown[];
  displayName?: string;
}

export const MemoizedComponent = memo<MemoizedComponentProps>(
  ({ children }) => <>{children}</>,
  (prevProps, nextProps) => {
    // Custom comparison logic
    if (prevProps.deps && nextProps.deps) {
      return prevProps.deps.every((dep, index) => 
        Object.is(dep, nextProps.deps?.[index])
      );
    }
    
    // Fallback to shallow comparison
    return Object.is(prevProps.children, nextProps.children);
  }
);

MemoizedComponent.displayName = 'MemoizedComponent';

// Higher-order component for automatic memoization
export const withMemoization = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoizedWrapper = memo(Component, areEqual);
  MemoizedWrapper.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedWrapper;
};
