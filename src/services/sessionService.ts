
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
  stored_at: number;
}

export class SessionService {
  private static instance: SessionService;
  private readonly SESSION_KEY = 'kisanshakti_session';

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Basic session validation - simplified approach
   */
  validateSessionData(sessionData: any): { isValid: boolean; session?: Session; error?: string } {
    console.log('Validating session data');

    if (!sessionData || typeof sessionData !== 'object') {
      return { isValid: false, error: 'Invalid session data structure' };
    }

    if (!sessionData.access_token || !sessionData.refresh_token) {
      return { isValid: false, error: 'Missing session tokens' };
    }

    if (!sessionData.user || !sessionData.user.id) {
      return { isValid: false, error: 'Missing user data' };
    }

    // Basic token format check - just ensure they're strings
    if (typeof sessionData.access_token !== 'string' || typeof sessionData.refresh_token !== 'string') {
      return { isValid: false, error: 'Invalid token format' };
    }

    const session: Session = {
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_at: sessionData.expires_at,
      expires_in: sessionData.expires_in || 3600,
      token_type: sessionData.token_type || 'bearer',
      user: sessionData.user
    };

    return { isValid: true, session };
  }

  /**
   * Store session securely
   */
  async storeSession(sessionData: any): Promise<void> {
    try {
      const validation = this.validateSessionData(sessionData);
      if (!validation.isValid) {
        throw new Error(`Cannot store invalid session: ${validation.error}`);
      }

      const storedSession: StoredSession = {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at || Math.floor(Date.now() / 1000) + 3600,
        user: sessionData.user,
        stored_at: Date.now()
      };

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: this.SESSION_KEY,
          value: JSON.stringify(storedSession)
        });
      } else {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(storedSession));
      }

      console.log('Session stored successfully');
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Retrieve stored session
   */
  async getStoredSession(): Promise<StoredSession | null> {
    try {
      let sessionData: string | null = null;

      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: this.SESSION_KEY });
        sessionData = result.value;
      } else {
        sessionData = localStorage.getItem(this.SESSION_KEY);
      }

      if (!sessionData) {
        return null;
      }

      const stored: StoredSession = JSON.parse(sessionData);

      // Simple expiry check
      const now = Math.floor(Date.now() / 1000);
      if (stored.expires_at <= now) {
        console.log('Stored session is expired, removing...');
        await this.clearSession();
        return null;
      }

      return stored;
    } catch (error) {
      console.error('Error retrieving stored session:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Clear stored session
   */
  async clearSession(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: this.SESSION_KEY });
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Restore session from storage
   */
  async restoreSession(): Promise<Session | null> {
    try {
      console.log('Attempting to restore session from storage...');
      
      const storedSession = await this.getStoredSession();
      if (!storedSession) {
        console.log('No valid stored session found');
        return null;
      }

      console.log('Found stored session, restoring...');
      
      // Try to set the session with Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token
      });

      if (error) {
        console.error('Error restoring session:', error);
        await this.clearSession();
        return null;
      }

      if (!data.session) {
        console.log('Session restoration failed - no session returned');
        await this.clearSession();
        return null;
      }

      console.log('Session restored successfully');
      
      // Update stored session if tokens refreshed
      if (data.session.access_token !== storedSession.access_token) {
        await this.storeSession(data.session);
      }

      return data.session;
    } catch (error) {
      console.error('Error during session restoration:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Set session with simplified retry mechanism
   */
  async setSession(sessionData: any): Promise<Session> {
    try {
      console.log('Setting session...');

      // Validate session data
      const validation = this.validateSessionData(sessionData);
      if (!validation.isValid || !validation.session) {
        throw new Error(`Invalid session data: ${validation.error}`);
      }

      // Set session with Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });

      if (error) {
        console.error('Supabase setSession error:', error);
        throw new Error(`Failed to set session: ${error.message}`);
      }

      if (!data.session) {
        throw new Error('Session establishment failed - no session returned');
      }

      console.log('Session set successfully, storing for future use...');
      
      // Store the session for future restoration
      await this.storeSession(data.session);
      
      // Track session in database
      await this.trackSession(data.session);

      return data.session;
    } catch (error) {
      console.error('Session setting failed:', error);
      throw error;
    }
  }

  /**
   * Track session in database
   */
  private async trackSession(session: Session): Promise<void> {
    try {
      const deviceInfo = {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      await supabase.from('user_sessions').insert({
        user_id: session.user.id,
        session_id: session.access_token.substring(0, 32),
        access_token_hash: await this.hashToken(session.access_token),
        refresh_token_hash: await this.hashToken(session.refresh_token),
        expires_at: new Date(session.expires_at! * 1000).toISOString(),
        device_info: deviceInfo
      });

      console.log('Session tracked in database');
    } catch (error) {
      console.error('Error tracking session:', error);
      // Don't throw - session tracking is not critical
    }
  }

  /**
   * Hash token for storage
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }
}

export const sessionService = SessionService.getInstance();
