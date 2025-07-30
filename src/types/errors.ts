
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
  context?: {
    component?: string;
    page?: string;
    tenant?: string;
    user?: string;
    action?: string;
  };
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  retryCount: number;
  lastRetryAt?: number;
}

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackComponent?: React.ComponentType<any>;
  onError?: (error: AppError) => void;
  onRetry?: () => void;
}

export type ErrorLevel = 'component' | 'page' | 'critical';

export class AppErrorBuilder {
  private error: Partial<AppError>;

  constructor(code: string, message: string) {
    this.error = {
      code,
      message,
      timestamp: Date.now(),
    };
  }

  withDetails(details: unknown): this {
    this.error.details = details;
    return this;
  }

  withContext(context: AppError['context']): this {
    this.error.context = { ...this.error.context, ...context };
    return this;
  }

  build(): AppError {
    return this.error as AppError;
  }
}

export const createError = (code: string, message: string) => 
  new AppErrorBuilder(code, message);
