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

interface SessionValidationResult {
  isValid: boolean;
  session?: Session;
  error?: string;
}

export class SessionService {
  private static instance: SessionService;
  private readonly SESSION_KEY = 'kisanshakti_session';
  private readonly SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Validate JWT token structure
   */
  private isValidJWT(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        console.log('Invalid token: not a string or empty');
        return false;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid JWT: wrong number of parts');
        return false;
      }

      // Try to decode the header and payload
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      // Check for required fields
      if (!header.alg || !payload.sub || !payload.exp) {
        console.log('Invalid JWT: missing required fields');
        return false;
      }

      // Check if token is not expired (with buffer)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        console.log('Invalid JWT: token expired');
        return false;
      }

      return true;
    } catch (error) {
      console.log('JWT validation error:', error);
      return false;
    }
  }

  /**
   * Validate session data structure and tokens
   */
  validateSessionData(sessionData: any): SessionValidationResult {
    console.log('Validating session data:', {
      hasAccessToken: !!sessionData?.access_token,
      hasRefreshToken: !!sessionData?.refresh_token,
      hasUser: !!sessionData?.user,
      accessTokenType: typeof sessionData?.access_token,
      refreshTokenType: typeof sessionData?.refresh_token
    });

    if (!sessionData || typeof sessionData !== 'object') {
      return { isValid: false, error: 'Invalid session data structure' };
    }

    if (!sessionData.access_token || !sessionData.refresh_token) {
      return { isValid: false, error: 'Missing session tokens' };
    }

    if (!sessionData.user || !sessionData.user.id) {
      return { isValid: false, error: 'Missing user data' };
    }

    // Validate JWT token structure
    if (!this.isValidJWT(sessionData.access_token)) {
      return { isValid: false, error: 'Invalid access token format' };
    }

    if (!this.isValidJWT(sessionData.refresh_token)) {
      return { isValid: false, error: 'Invalid refresh token format' };
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
   * Store session securely using Capacitor Preferences
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

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (stored.expires_at <= now) {
        console.log('Stored session is expired, removing...');
        await this.clearSession();
        return null;
      }

      return stored;
    } catch (error) {
      console.error('Error retrieving stored session:', error);
      await this.clearSession(); // Clear corrupted session
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

      console.log('Found stored session, validating...');
      
      // Validate the stored session
      const validation = this.validateSessionData(storedSession);
      if (!validation.isValid || !validation.session) {
        console.log('Stored session is invalid:', validation.error);
        await this.clearSession();
        return null;
      }

      console.log('Stored session is valid, attempting to restore...');
      
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
      
      // Update stored session with refreshed data if needed
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
   * Set session with validation and retry mechanism
   */
  async setSession(sessionData: any, retryCount = 0): Promise<Session> {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // Progressive delay

    try {
      console.log(`Setting session (attempt ${retryCount + 1}/${maxRetries + 1})`);

      // Validate session data before attempting to set
      const validation = this.validateSessionData(sessionData);
      if (!validation.isValid || !validation.session) {
        throw new Error(`Invalid session data: ${validation.error}`);
      }

      console.log('Session data validated, setting session...');

      // Set session with Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });

      if (error) {
        console.error('Supabase setSession error:', error);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.setSession(sessionData, retryCount + 1);
        }
        
        throw new Error(`Failed to set session after ${maxRetries + 1} attempts: ${error.message}`);
      }

      if (!data.session) {
        if (retryCount < maxRetries) {
          console.log('No session returned, retrying...');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.setSession(sessionData, retryCount + 1);
        }
        
        throw new Error('Session establishment failed - no session returned');
      }

      console.log('Session set successfully, storing for future use...');
      
      // Store the session for future restoration
      await this.storeSession(data.session);
      
      // Track session in database
      await this.trackSession(data.session);

      return data.session;
    } catch (error) {
      console.error(`Session setting failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.setSession(sessionData, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Track session in database for monitoring
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
        session_id: session.access_token.substring(0, 32), // Use first 32 chars as session ID
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
   * Hash token for storage (basic hashing for tracking)
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }

  /**
   * Check if session needs refresh
   */
  isSessionExpiringSoon(session: Session): boolean {
    if (!session.expires_at) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiryWithBuffer = session.expires_at - (this.SESSION_EXPIRY_BUFFER / 1000);
    
    return now >= expiryWithBuffer;
  }

  /**
   * Refresh session if needed
   */
  async refreshSessionIfNeeded(session: Session): Promise<Session> {
    if (!this.isSessionExpiringSoon(session)) {
      return session;
    }

    console.log('Session expiring soon, refreshing...');
    
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token
      });

      if (error || !data.session) {
        console.error('Session refresh failed:', error);
        throw new Error('Failed to refresh session');
      }

      console.log('Session refreshed successfully');
      await this.storeSession(data.session);
      return data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  }
}

export const sessionService = SessionService.getInstance();