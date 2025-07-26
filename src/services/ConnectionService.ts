
import { supabase } from '@/integrations/supabase/client';

export class ConnectionService {
  private static instance: ConnectionService;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second
  private isOnline = navigator.onLine;

  static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  constructor() {
    // Listen for network changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connection lost');
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    return this.baseDelay * Math.pow(2, attempt); // Exponential backoff
  }

  /**
   * Test connection to Supabase services with enhanced error handling
   */
  async testConnection(): Promise<{
    isConnected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Check network status first
      if (!this.isOnline) {
        return {
          isConnected: false,
          error: 'No internet connection detected. Please check your network settings.'
        };
      }

      // Test basic connectivity with a simple ping-like request
      try {
        const pingResponse = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
      } catch (pingError) {
        return {
          isConnected: false,
          error: 'Internet connectivity issue. Please check your connection.'
        };
      }

      // Test Supabase connection with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id')
          .limit(1);

        clearTimeout(timeoutId);

        if (error) {
          throw new Error(`Database connection failed: ${error.message}`);
        }

        const latency = Date.now() - startTime;
        console.log('Connection test successful, latency:', latency + 'ms');
        
        return {
          isConnected: true,
          latency
        };
      } catch (supabaseError) {
        clearTimeout(timeoutId);
        throw supabaseError;
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      
      let errorMessage = 'Unable to connect to KisanShakti AI servers.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Connection timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Database connection failed')) {
          errorMessage = 'Server temporarily unavailable. Please try again in a few moments.';
        }
      }

      return {
        isConnected: false,
        error: errorMessage
      };
    }
  }

  /**
   * Enhanced edge function call with retry logic and better error handling
   */
  async callEdgeFunction<T = any>(
    functionName: string,
    payload: any,
    options: {
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    const { retries = this.maxRetries, timeout = 15000 } = options;
    
    // Check network status first
    if (!this.isOnline) {
      return {
        data: null,
        error: 'No internet connection. Please check your network settings and try again.'
      };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Calling ${functionName} (attempt ${attempt + 1}/${retries + 1})`);

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        // Create function call promise
        const functionPromise = supabase.functions.invoke(functionName, {
          body: payload
        });

        // Race between function call and timeout
        const result = await Promise.race([functionPromise, timeoutPromise]);
        
        if (result.error) {
          console.error(`${functionName} returned error:`, result.error);
          throw new Error(result.error.message || 'Edge function error');
        }

        console.log(`${functionName} call successful`);
        return result;

      } catch (error) {
        console.error(`${functionName} attempt ${attempt + 1} failed:`, error);

        if (attempt === retries) {
          // Last attempt failed - provide user-friendly error
          let userError = 'Unable to connect to KisanShakti AI servers. Please check your internet connection and try again.';
          
          if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              userError = 'Request timed out. Please try again.';
            } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
              userError = 'Network connection issue. Please check your internet connection and try again.';
            } else if (error.message.includes('Edge Function')) {
              userError = 'Service temporarily unavailable. Please try again in a few minutes.';
            }
          }

          return {
            data: null,
            error: userError
          };
        }

        // Wait before retry with exponential backoff
        const delay = this.getRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    return {
      data: null,
      error: 'All retry attempts failed'
    };
  }

  /**
   * Check if we're in a good network state
   */
  async isNetworkHealthy(): Promise<boolean> {
    try {
      if (!this.isOnline) return false;

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): {
    isOnline: boolean;
    connection?: string;
  } {
    return {
      isOnline: this.isOnline,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }

  /**
   * Reset connection state
   */
  resetConnection(): void {
    this.connectionAttempts = 0;
    console.log('Connection state reset');
  }
}

export const connectionService = ConnectionService.getInstance();
