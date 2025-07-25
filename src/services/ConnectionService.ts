
import { supabase } from '@/integrations/supabase/client';

export class ConnectionService {
  private static instance: ConnectionService;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    return this.baseDelay * Math.pow(2, attempt); // Exponential backoff
  }

  /**
   * Test connection to Supabase services
   */
  async testConnection(): Promise<{
    isConnected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test database connection
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      const latency = Date.now() - startTime;
      console.log('Connection test successful, latency:', latency + 'ms');
      
      return {
        isConnected: true,
        latency
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  /**
   * Enhanced edge function call with retry logic
   */
  async callEdgeFunction<T = any>(
    functionName: string,
    payload: any,
    options: {
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    const { retries = this.maxRetries, timeout = 10000 } = options;
    
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
          throw new Error(result.error.message || 'Edge function error');
        }

        console.log(`${functionName} call successful`);
        return result;

      } catch (error) {
        console.error(`${functionName} attempt ${attempt + 1} failed:`, error);

        if (attempt === retries) {
          // Last attempt failed
          return {
            data: null,
            error: error instanceof Error ? error.message : 'Function call failed'
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
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
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
