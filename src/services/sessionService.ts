
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
  session_hash: string;
}

export class SessionService {
  private static instance: SessionService;
  private readonly SESSION_KEY = 'kisanshakti_session_v2'; // Versioned for security
  private readonly MAX_SESSION_AGE = 86400; // 24 hours in seconds

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Enhanced session validation with security checks
   */
  validateSessionData(sessionData: any): { isValid: boolean; session?: Session; error?: string } {
    console.log('Validating session data with enhanced security checks');

    if (!sessionData || typeof sessionData !== 'object') {
      return { isValid: false, error: 'Invalid session data structure' };
    }

    if (!sessionData.access_token || !sessionData.refresh_token) {
      return { isValid: false, error: 'Missing session tokens' };
    }

    if (!sessionData.user || !sessionData.user.id) {
      return { isValid: false, error: 'Missing user data' };
    }

    // Enhanced token format validation
    if (typeof sessionData.access_token !== 'string' || typeof sessionData.refresh_token !== 'string') {
      return { isValid: false, error: 'Invalid token format' };
    }

    // JWT structure validation
    const accessTokenParts = sessionData.access_token.split('.');
    const refreshTokenParts = sessionData.refresh_token.split('.');
    
    if (accessTokenParts.length !== 3 || refreshTokenParts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT structure' };
    }

    // Check token expiry with buffer
    const now = Math.floor(Date.now() / 1000);
    const tokenBuffer = 60; // 1 minute buffer
    
    if (sessionData.expires_at && sessionData.expires_at <= (now + tokenBuffer)) {
      return { isValid: false, error: 'Session expired' };
    }

    // Check session age
    if (sessionData.stored_at && (Date.now() - sessionData.stored_at) > (this.MAX_SESSION_AGE * 1000)) {
      return { isValid: false, error: 'Session too old' };
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
   * Create secure hash for session integrity
   */
  private async createSessionHash(sessionData: any): Promise<string> {
    const dataToHash = `${sessionData.access_token}:${sessionData.user.id}:${sessionData.stored_at}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }

  /**
   * Verify session integrity
   */
  private async verifySessionIntegrity(storedSession: StoredSession): Promise<boolean> {
    try {
      const expectedHash = await this.createSessionHash(storedSession);
      return storedSession.session_hash === expectedHash;
    } catch (error) {
      console.error('Session integrity check failed:', error);
      return false;
    }
  }

  /**
   * Store session securely with integrity checks
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
        stored_at: Date.now(),
        session_hash: '' // Will be filled below
      };

      // Create integrity hash
      storedSession.session_hash = await this.createSessionHash(storedSession);

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: this.SESSION_KEY,
          value: JSON.stringify(storedSession)
        });
      } else {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(storedSession));
      }

      console.log('Session stored securely with integrity check');
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Retrieve stored session with security validation
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

      // Enhanced expiry check
      const now = Math.floor(Date.now() / 1000);
      if (stored.expires_at <= now) {
        console.log('Stored session is expired, removing...');
        await this.clearSession();
        return null;
      }

      // Check session age
      if ((Date.now() - stored.stored_at) > (this.MAX_SESSION_AGE * 1000)) {
        console.log('Session too old, removing...');
        await this.clearSession();
        return null;
      }

      // Verify session integrity
      if (stored.session_hash && !(await this.verifySessionIntegrity(stored))) {
        console.log('Session integrity check failed, removing...');
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
   * Clear stored session securely
   */
  async clearSession(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: this.SESSION_KEY });
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
      console.log('Session cleared securely');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Restore session from storage with enhanced validation
   */
  async restoreSession(): Promise<Session | null> {
    try {
      console.log('Attempting to restore session from secure storage...');
      
      const storedSession = await this.getStoredSession();
      if (!storedSession) {
        console.log('No valid stored session found');
        return null;
      }

      console.log('Found stored session, validating and restoring...');
      
      // Enhanced session validation using edge function
      try {
        const { data: validationResult, error: validationError } = await supabase.functions.invoke('session-validate', {
          body: {
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token,
            user_id: storedSession.user.id
          }
        });

        if (validationError || !validationResult?.valid) {
          console.log('Session validation failed:', validationResult?.error || validationError?.message);
          await this.clearSession();
          return null;
        }

        console.log('Session validation passed');
      } catch (validationError) {
        console.error('Session validation error:', validationError);
        // Continue with local validation as fallback
      }
      
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
   * Set session with enhanced security and validation
   */
  async setSession(sessionData: any): Promise<Session> {
    try {
      console.log('Setting session with enhanced security...');

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

      console.log('Session set successfully, storing securely...');
      
      // Store the session for future restoration
      await this.storeSession(data.session);
      
      // Track session in database with validation
      await this.trackSession(data.session);

      return data.session;
    } catch (error) {
      console.error('Session setting failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced session tracking with validation
   */
  private async trackSession(session: Session): Promise<void> {
    try {
      // Validate session data before tracking
      if (!session.user?.id || !session.access_token || !session.refresh_token) {
        console.error('Invalid session data for tracking');
        return;
      }

      const deviceInfo = {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        userAgent: navigator.userAgent.substring(0, 500), // Limit length
        timestamp: new Date().toISOString(),
        sessionVersion: 'v2'
      };

      // Use session validation edge function for enhanced tracking
      await supabase.functions.invoke('session-validate', {
        body: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user_id: session.user.id,
          track_session: true,
          device_info: deviceInfo
        }
      });

      console.log('Session tracked securely');
    } catch (error) {
      console.error('Error tracking session:', error);
      // Don't throw - session tracking is not critical
    }
  }
}

export const sessionService = SessionService.getInstance();
