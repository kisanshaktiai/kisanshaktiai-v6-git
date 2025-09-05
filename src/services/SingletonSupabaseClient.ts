import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

class SingletonSupabaseClient {
  private static instance: SupabaseClient<Database> | null = null;

  static getInstance(): SupabaseClient<Database> {
    if (!this.instance) {
      const SUPABASE_URL = "https://qfklkkzxemsbeniyugiz.supabase.co";
      const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2xra3p4ZW1zYmVuaXl1Z2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjcxNjUsImV4cCI6MjA2ODAwMzE2NX0.dUnGp7wbwYom1FPbn_4EGf3PWjgmr8mXwL2w2SdYOh4";
      
      this.instance = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          storage: typeof window !== 'undefined' ? localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

export const supabaseClient = SingletonSupabaseClient.getInstance();