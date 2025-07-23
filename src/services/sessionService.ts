
import { localStorageService } from './storage/localStorageService';
import { customAuthService } from './customAuthService';

interface Session {
  user: any;
  token: string;
  permissions: string[];
  featureAccess: Record<string, boolean>;
  expiresAt: number;
  lastActivity: number;
}

export class SessionService {
  private static instance: SessionService;
  private session: Session | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  async createSession(user: any, token: string): Promise<void> {
    const session: Session = {
      user,
      token,
      permissions: this.getUserPermissions(user),
      featureAccess: this.getFeatureAccess(user),
      expiresAt: Date.now() + this.SESSION_DURATION,
      lastActivity: Date.now()
    };

    this.session = session;
    localStorageService.setSecure('user_session', session);
    this.startActivityTimer();
  }

  async restoreSession(): Promise<boolean> {
    try {
      const storedSession = localStorageService.getSecure('user_session');
      if (!storedSession) return false;

      const session: Session = storedSession;
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return false;
      }

      // Check if session is stale (no activity for threshold time)
      if (Date.now() - session.lastActivity > this.ACTIVITY_THRESHOLD) {
        // Try to refresh session
        const refreshed = await this.refreshSession(session);
        if (!refreshed) {
          this.clearSession();
          return false;
        }
      }

      this.session = session;
      this.startActivityTimer();
      return true;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }

  private async refreshSession(session: Session): Promise<boolean> {
    try {
      // Validate with custom auth service
      const currentFarmer = customAuthService.getCurrentFarmer();
      const currentToken = customAuthService.getCurrentToken();
      
      if (!currentFarmer || !currentToken) {
        return false;
      }

      // Update session with fresh data
      session.user = currentFarmer;
      session.token = currentToken;
      session.lastActivity = Date.now();
      session.expiresAt = Date.now() + this.SESSION_DURATION;

      localStorageService.setSecure('user_session', session);
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  updateActivity(): void {
    if (this.session) {
      this.session.lastActivity = Date.now();
      localStorageService.setSecure('user_session', this.session);
    }
  }

  private startActivityTimer(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }

    this.activityTimer = setInterval(() => {
      this.updateActivity();
    }, 60000); // Update every minute
  }

  getSession(): Session | null {
    return this.session;
  }

  getCurrentUser(): any {
    return this.session?.user || null;
  }

  hasPermission(permission: string): boolean {
    return this.session?.permissions.includes(permission) || false;
  }

  hasFeatureAccess(feature: string): boolean {
    return this.session?.featureAccess[feature] || false;
  }

  updateFeatureAccess(feature: string, hasAccess: boolean): void {
    if (this.session) {
      this.session.featureAccess[feature] = hasAccess;
      localStorageService.setSecure('user_session', this.session);
      
      // Also update the feature access cache
      localStorageService.setFeatureAccessStatus(feature, hasAccess);
    }
  }

  clearSession(): void {
    this.session = null;
    localStorageService.setSecure('user_session', null);
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private getUserPermissions(user: any): string[] {
    // Define user permissions based on user type/role
    const basePermissions = ['read:profile', 'update:profile'];
    
    if (user.is_verified) {
      basePermissions.push('access:verified_features');
    }
    
    if (user.profile_completion_percentage >= 50) {
      basePermissions.push('access:advanced_features');
    }
    
    return basePermissions;
  }

  private getFeatureAccess(user: any): Record<string, boolean> {
    const completion = user.profile_completion_percentage || 0;
    const featureRules = localStorageService.getFeatureAccessRules();
    
    const access: Record<string, boolean> = {};
    
    Object.entries(featureRules).forEach(([feature, rule]) => {
      access[feature] = rule.alwaysAvailable || completion >= rule.minCompletion;
    });
    
    return access;
  }

  calculateProfileCompletion(user: any): number {
    const requiredFields = ['farmer_code', 'mobile_number'];
    const optionalFields = [
      'primary_crops', 'total_land_acres', 'farming_experience_years',
      'annual_income_range', 'farm_type', 'has_irrigation'
    ];
    
    let completedRequired = 0;
    let completedOptional = 0;
    
    requiredFields.forEach(field => {
      if (user[field] && user[field].toString().trim()) {
        completedRequired++;
      }
    });
    
    optionalFields.forEach(field => {
      if (user[field] !== null && user[field] !== undefined) {
        completedOptional++;
      }
    });
    
    // Required fields count for 50%, optional for 50%
    const requiredPercentage = (completedRequired / requiredFields.length) * 50;
    const optionalPercentage = (completedOptional / optionalFields.length) * 50;
    
    return Math.round(requiredPercentage + optionalPercentage);
  }
}

export const sessionService = SessionService.getInstance();
