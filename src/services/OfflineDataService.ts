import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Network } from '@capacitor/network';

interface KisanShaktiDBSchema extends DBSchema {
  lands: {
    key: string;
    value: {
      id: string;
      name: string;
      area_in_acres: number;
      location: { lat: number; lng: number };
      boundary_points: any[];
      farmer_id: string;
      tenant_id: string;
      updated_at: number;
      sync_status: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-farmer': string; 'by-tenant': string; 'by-sync': string };
  };
  
  crops: {
    key: string;
    value: {
      id: string;
      land_id: string;
      crop_name: string;
      variety: string;
      planting_date: string;
      expected_harvest: string;
      status: string;
      farmer_id: string;
      tenant_id: string;
      updated_at: number;
      sync_status: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-land': string; 'by-farmer': string; 'by-status': string };
  };
  
  ai_responses: {
    key: string;
    value: {
      id: string;
      query: string;
      response: string;
      context: any;
      timestamp: number;
      farmer_id: string;
      cached: boolean;
      ttl: number;
    };
    indexes: { 'by-farmer': string; 'by-timestamp': number };
  };
  
  weather_cache: {
    key: string;
    value: {
      location: string;
      data: any;
      timestamp: number;
      ttl: number;
    };
    indexes: { 'by-location': string; 'by-timestamp': number };
  };

  images: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      metadata: {
        type: string;
        size: number;
        land_id?: string;
        crop_id?: string;
        purpose: 'disease' | 'growth' | 'soil' | 'other';
      };
      timestamp: number;
      sync_status: 'synced' | 'pending';
    };
    indexes: { 'by-land': string; 'by-crop': string; 'by-sync': string };
  };
}

export class OfflineDataService {
  private static instance: OfflineDataService;
  private db: IDBPDatabase<KisanShaktiDBSchema> | null = null;
  private readonly DB_NAME = 'KisanShaktiOfflineDB';
  private readonly DB_VERSION = 1;
  private syncQueue: Set<string> = new Set();

  private constructor() {}

  static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService();
    }
    return OfflineDataService.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<KisanShaktiDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Lands store
        if (!db.objectStoreNames.contains('lands')) {
          const landsStore = db.createObjectStore('lands', { keyPath: 'id' });
          landsStore.createIndex('by-farmer', 'farmer_id');
          landsStore.createIndex('by-tenant', 'tenant_id');
          landsStore.createIndex('by-sync', 'sync_status');
        }

        // Crops store
        if (!db.objectStoreNames.contains('crops')) {
          const cropsStore = db.createObjectStore('crops', { keyPath: 'id' });
          cropsStore.createIndex('by-land', 'land_id');
          cropsStore.createIndex('by-farmer', 'farmer_id');
          cropsStore.createIndex('by-status', 'status');
        }

        // AI responses cache
        if (!db.objectStoreNames.contains('ai_responses')) {
          const aiStore = db.createObjectStore('ai_responses', { keyPath: 'id' });
          aiStore.createIndex('by-farmer', 'farmer_id');
          aiStore.createIndex('by-timestamp', 'timestamp');
        }

        // Weather cache
        if (!db.objectStoreNames.contains('weather_cache')) {
          const weatherStore = db.createObjectStore('weather_cache', { keyPath: 'location' });
          weatherStore.createIndex('by-location', 'location');
          weatherStore.createIndex('by-timestamp', 'timestamp');
        }

        // Images store
        if (!db.objectStoreNames.contains('images')) {
          const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
          imagesStore.createIndex('by-land', 'metadata.land_id');
          imagesStore.createIndex('by-crop', 'metadata.crop_id');
          imagesStore.createIndex('by-sync', 'sync_status');
        }
      }
    });

    // Setup cleanup interval
    this.setupCleanupInterval();
  }

  private setupCleanupInterval() {
    // Clean up expired cache every hour
    setInterval(async () => {
      await this.cleanupExpiredCache();
    }, 60 * 60 * 1000);
  }

  // Lands Management
  async saveLand(land: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    const networkStatus = await Network.getStatus();
    const syncStatus = networkStatus.connected ? 'pending' : 'pending';
    
    const landData = {
      ...land,
      updated_at: Date.now(),
      sync_status: syncStatus
    };

    await this.db!.put('lands', landData);
    
    if (networkStatus.connected) {
      this.syncQueue.add(`land_${land.id}`);
    }
  }

  async getLand(id: string): Promise<any> {
    if (!this.db) await this.initialize();
    return await this.db!.get('lands', id);
  }

  async getLandsByFarmer(farmerId: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('lands', 'readonly');
    const index = tx.store.index('by-farmer');
    return await index.getAll(farmerId);
  }

  async getPendingLands(): Promise<any[]> {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('lands', 'readonly');
    const index = tx.store.index('by-sync');
    return await index.getAll('pending');
  }

  // Crops Management
  async saveCrop(crop: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    const networkStatus = await Network.getStatus();
    const syncStatus = networkStatus.connected ? 'pending' : 'pending';
    
    const cropData = {
      ...crop,
      updated_at: Date.now(),
      sync_status: syncStatus
    };

    await this.db!.put('crops', cropData);
    
    if (networkStatus.connected) {
      this.syncQueue.add(`crop_${crop.id}`);
    }
  }

  async getCropsByLand(landId: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('crops', 'readonly');
    const index = tx.store.index('by-land');
    return await index.getAll(landId);
  }

  // AI Response Caching
  async cacheAIResponse(query: string, response: string, context: any, farmerId: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const id = `${farmerId}_${Date.now()}_${Math.random()}`;
    const aiResponse = {
      id,
      query,
      response,
      context,
      timestamp: Date.now(),
      farmer_id: farmerId,
      cached: true,
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    await this.db!.put('ai_responses', aiResponse);
  }

  async getAIResponseCache(farmerId: string, limit: number = 10): Promise<any[]> {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('ai_responses', 'readonly');
    const index = tx.store.index('by-farmer');
    const all = await index.getAll(farmerId);
    
    // Sort by timestamp descending and limit
    return all
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async searchAIResponses(query: string, farmerId: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    const responses = await this.getAIResponseCache(farmerId, 50);
    
    // Simple text search
    const searchTerms = query.toLowerCase().split(' ');
    return responses.filter(r => {
      const text = `${r.query} ${r.response}`.toLowerCase();
      return searchTerms.some(term => text.includes(term));
    });
  }

  // Weather Caching
  async cacheWeatherData(location: string, data: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    const weatherData = {
      location,
      data,
      timestamp: Date.now(),
      ttl: 30 * 60 * 1000 // 30 minutes
    };

    await this.db!.put('weather_cache', weatherData);
  }

  async getWeatherCache(location: string): Promise<any> {
    if (!this.db) await this.initialize();
    const cached = await this.db!.get('weather_cache', location);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      await this.db!.delete('weather_cache', location);
      return null;
    }
    
    return cached.data;
  }

  // Image Management
  async saveImage(imageBlob: Blob, metadata: any): Promise<string> {
    if (!this.db) await this.initialize();
    
    const id = `img_${Date.now()}_${Math.random()}`;
    const networkStatus = await Network.getStatus();
    
    const imageData = {
      id,
      blob: imageBlob,
      metadata,
      timestamp: Date.now(),
      sync_status: networkStatus.connected ? 'pending' : 'pending' as const
    };

    await this.db!.put('images', imageData);
    
    if (networkStatus.connected) {
      this.syncQueue.add(`image_${id}`);
    }
    
    return id;
  }

  async getImage(id: string): Promise<Blob | null> {
    if (!this.db) await this.initialize();
    const image = await this.db!.get('images', id);
    return image?.blob || null;
  }

  async getPendingImages(): Promise<any[]> {
    if (!this.db) await this.initialize();
    const tx = this.db!.transaction('images', 'readonly');
    const index = tx.store.index('by-sync');
    return await index.getAll('pending');
  }

  // Cleanup
  private async cleanupExpiredCache(): Promise<void> {
    if (!this.db) return;

    const now = Date.now();

    // Clean expired AI responses
    const aiResponses = await this.db.getAll('ai_responses');
    for (const response of aiResponses) {
      if (now - response.timestamp > response.ttl) {
        await this.db.delete('ai_responses', response.id);
      }
    }

    // Clean expired weather data
    const weatherData = await this.db.getAll('weather_cache');
    for (const weather of weatherData) {
      if (now - weather.timestamp > weather.ttl) {
        await this.db.delete('weather_cache', weather.location);
      }
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize();
    
    const stores = ['lands', 'crops', 'ai_responses', 'weather_cache', 'images'] as const;
    
    for (const store of stores) {
      await this.db!.clear(store);
    }
  }

  async getStorageStats(): Promise<{
    lands: number;
    crops: number;
    aiResponses: number;
    weatherCache: number;
    images: number;
    totalSize: string;
  }> {
    if (!this.db) await this.initialize();

    const lands = await this.db!.count('lands');
    const crops = await this.db!.count('crops');
    const aiResponses = await this.db!.count('ai_responses');
    const weatherCache = await this.db!.count('weather_cache');
    const images = await this.db!.count('images');

    // Estimate storage size (rough calculation)
    const estimate = await navigator.storage.estimate();
    const totalSize = estimate.usage ? `${(estimate.usage / 1024 / 1024).toFixed(2)} MB` : 'Unknown';

    return {
      lands,
      crops,
      aiResponses,
      weatherCache,
      images,
      totalSize
    };
  }

  // Sync Management
  getSyncQueue(): string[] {
    return Array.from(this.syncQueue);
  }

  clearSyncQueue(): void {
    this.syncQueue.clear();
  }

  removefromSyncQueue(id: string): void {
    this.syncQueue.delete(id);
  }
}

export const offlineDataService = OfflineDataService.getInstance();