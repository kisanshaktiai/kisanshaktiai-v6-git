
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

class SecureStorageService {
  private static instance: SecureStorageService;

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }

  async setObject(key: string, value: any): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Add aliases for backward compatibility
  async set(key: string, value: string): Promise<void> {
    return this.setItem(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.getItem(key);
  }

  async remove(key: string): Promise<void> {
    return this.removeItem(key);
  }
}

export const secureStorage = SecureStorageService.getInstance();
