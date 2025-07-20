
import { useCallback, useState } from 'react';

export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);

  const captureError = useCallback((error: Error) => {
    console.error('Manual error capture:', error);
    setError(error);
    throw error; // Re-throw to trigger error boundary
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    captureError,
    resetError,
    hasError: !!error,
    error,
  };
};
