
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from './storage/secureStorage';

// Add SESSION constant locally since it's not in STORAGE_KEYS
const SESSION_KEY = 'kisanshakti_session';

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: any;
}

interface SessionValidationResult {
  isValid: boolean;
  error?: string;
}

export class SessionService {
  private static instance: SessionService;

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Enhanced session validation with better error handling - now public
   */
  validateSessionData(session: any): SessionValidationResult {
    if (!session) {
      console.error('Session validation failed: Session is null or undefined');
      return { isValid: false, error: 'Session is null or undefined' };
    }

    if (!session.access_token) {
      console.error('Session validation failed: Missing access_token');
      return { isValid: false, error: 'Missing access_token' };
    }

    if (!session.refresh_token) {
      console.error('Session validation failed: Missing refresh_token');
      return { isValid: false, error: 'Missing refresh_token' };
    }

    // Basic JWT structure check - just ensure it's a string with some content
    if (typeof session.access_token !== 'string' || session.access_token.length < 10) {
      console.error('Session validation failed: Invalid access_token format');
      return { isValid: false, error: 'Invalid access_token format' };
    }

    if (typeof session.refresh_token !== 'string' || session.refresh_token.length < 10) {
      console.error('Session validation failed: Invalid refresh_token format');
      return { isValid: false, error: 'Invalid refresh_token format' };
    }

    return { isValid: true };
  }

  /**
   * Set session with enhanced security validation
   */
  async setSession(session: Session): Promise<void> {
    try {
      console.log('Setting session with enhanced security...');
      
      const validation = this.validateSessionData(session);
      if (!validation.isValid) {
        throw new Error(`Invalid session data provided: ${validation.error}`);
      }

      // Store session securely before setting in Supabase
      await this.storeSession(session);
      console.log('Session stored securely');

      // Set session in Supabase - let Supabase handle JWT validation
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (error) {
        console.error('Supabase setSession error:', error);
        // Clean up stored session on failure
        await this.clearSession();
        throw error;
      }

      console.log('Session set successfully');
    } catch (error) {
      console.error('Session setting failed:', error);
      throw error;
    }
  }

  /**
   * Store session data securely
   */
  async storeSession(session: Session): Promise<void> {
    try {
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type || 'bearer',
        user: session.user,
        stored_at: Date.now()
      };

      await secureStorage.set(SESSION_KEY, JSON.stringify(sessionData));
      console.log('Session stored in secure storage');
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Restore session from secure storage
   */
  async restoreSession(): Promise<Session | null> {
    try {
      console.log('Attempting to restore session from secure storage...');
      const storedData = await secureStorage.get(SESSION_KEY);
      
      if (!storedData) {
        console.log('No stored session found');
        return null;
      }

      const sessionData: SessionData = JSON.parse(storedData);
      
      // Check if session is expired
      if (sessionData.expires_at && sessionData.expires_at <= Math.floor(Date.now() / 1000)) {
        console.log('Stored session is expired, removing...');
        await this.clearSession();
        return null;
      }

      // Validate restored session
      const validation = this.validateSessionData(sessionData);
      if (!validation.isValid) {
        console.log('Stored session data is invalid, removing...');
        await this.clearSession();
        return null;
      }

      console.log('Valid stored session found');
      return sessionData as Session;
    } catch (error) {
      console.error('Error restoring session:', error);
      await this.clearSession(); // Clean up on error
      return null;
    }
  }

  /**
   * Clear stored session
   */
  async clearSession(): Promise<void> {
    try {
      await secureStorage.remove(SESSION_KEY);
      console.log('Session cleared from secure storage');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if current session is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null && !this.isSessionExpired(session);
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: Session): boolean {
    if (!session.expires_at) return false;
    return session.expires_at <= Math.floor(Date.now() / 1000);
  }
}

export const sessionService = SessionService.getInstance();
