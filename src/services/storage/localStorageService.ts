
import CryptoJS from 'crypto-js';

interface SyncOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface CacheItem {
  value: any;
  timestamp: number;
  ttlMinutes: number;
}

export class LocalStorageService {
  private encryptionKey = 'kisanshakti_secure_key_2024';
  private readonly SYNC_QUEUE_KEY = 'sync_queue';
  private readonly CACHE_PREFIX = 'cache_';

  // Secure storage with encryption
  setSecure(key: string, value: any): void {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value), 
        this.encryptionKey
      ).toString();
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Error setting secure storage:', error);
    }
  }

  getSecure(key: string): any {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Error getting secure storage:', error);
      return null;
    }
  }

  // Cache management with TTL
  setCacheWithTTL(key: string, value: any, ttlMinutes: number): void {
    const cacheItem: CacheItem = {
      value,
      timestamp: Date.now(),
      ttlMinutes
    };
    localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
  }

  getCacheIfValid(key: string): any | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem = JSON.parse(cached);
      const isExpired = Date.now() - cacheItem.timestamp > (cacheItem.ttlMinutes * 60 * 1000);
      
      if (isExpired) {
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        return null;
      }
      
      return cacheItem.value;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Sync queue management
  addToSyncQueue(operation: SyncOperation): void {
    const queue = this.getSyncQueue();
    queue.push(operation);
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  getSyncQueue(): SyncOperation[] {
    try {
      const queue = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  removeSyncOperation(operationId: string): void {
    const queue = this.getSyncQueue().filter(op => op.id !== operationId);
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  // User data management
  clearUserData(): void {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('secure_') || key.startsWith('cache_') || key.startsWith('user_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  exportUserData(): string {
    const data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(data);
  }

  // Feature access management
  getFeatureAccessRules(): Record<string, { minCompletion: number; alwaysAvailable?: boolean }> {
    const cached = this.getCacheIfValid('feature_access_rules');
    if (cached) return cached;

    const defaultRules = {
      weather: { minCompletion: 0, alwaysAvailable: true },
      aiChat: { minCompletion: 25 },
      myLand: { minCompletion: 50 },
      cropAdvisor: { minCompletion: 50 },
      organicInputs: { minCompletion: 75 },
      community: { minCompletion: 100 }
    };

    this.setCacheWithTTL('feature_access_rules', defaultRules, 1440); // 24 hours
    return defaultRules;
  }

  setFeatureAccessStatus(feature: string, unlocked: boolean): void {
    const status = this.getCacheIfValid('feature_access_status') || {};
    status[feature] = unlocked;
    this.setCacheWithTTL('feature_access_status', status, 1440);
  }

  getFeatureAccessStatus(): Record<string, boolean> {
    return this.getCacheIfValid('feature_access_status') || {};
  }
}

export const localStorageService = new LocalStorageService();
