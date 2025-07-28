
import Dexie, { Table } from 'dexie';

export interface CachedData {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'error';
  tenantId?: string;
  version?: number;
  expires?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  retryCount: number;
  tenantId?: string;
}

export interface OfflineFarmer {
  id: string;
  phone: string;
  tenantId: string;
  profile: any;
  lastSync: number;
}

export interface OfflineLand {
  id: string;
  farmerId: string;
  tenantId: string;
  name: string;
  areaAcres: number;
  data: any;
  lastSync: number;
}

export interface TenantConfig {
  id: string;
  tenantId: string;
  config: any;
  branding: any;
  features: any;
  activationCode?: string;
  isActive: boolean;
  lastSync: number;
}

export interface ActivationHistory {
  id?: number;
  activationCode: string;
  tenantId: string;
  activatedAt: number;
  deviceId: string;
  isActive: boolean;
}

class KisanShaktiDatabase extends Dexie {
  cache!: Table<CachedData>;
  syncQueue!: Table<SyncQueueItem>;
  farmers!: Table<OfflineFarmer>;
  lands!: Table<OfflineLand>;
  tenantConfigs!: Table<TenantConfig>;
  activationHistory!: Table<ActivationHistory>;
  
  constructor() {
    super('KisanShaktiDB');
    this.version(2).stores({
      cache: '++id, key, timestamp, syncStatus, tenantId, priority, expires',
      syncQueue: '++id, operation, table, timestamp, status, tenantId',
      farmers: 'id, phone, tenantId, lastSync',
      lands: 'id, farmerId, tenantId, lastSync',
      tenantConfigs: 'id, tenantId, isActive, lastSync',
      activationHistory: '++id, activationCode, tenantId, deviceId, isActive',
    });
  }

  async clearTenantData(tenantId: string) {
    await this.transaction('rw', [this.cache, this.syncQueue, this.farmers, this.lands, this.tenantConfigs], async () => {
      await this.cache.where('tenantId').equals(tenantId).delete();
      await this.syncQueue.where('tenantId').equals(tenantId).delete();
      await this.farmers.where('tenantId').equals(tenantId).delete();
      await this.lands.where('tenantId').equals(tenantId).delete();
      await this.tenantConfigs.where('tenantId').equals(tenantId).delete();
    });
  }

  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    return await this.tenantConfigs.where('tenantId').equals(tenantId).first() || null;
  }

  async setTenantConfig(config: TenantConfig) {
    await this.tenantConfigs.put(config);
  }

  async getActivationHistory(activationCode: string): Promise<ActivationHistory | null> {
    return await this.activationHistory.where('activationCode').equals(activationCode).first() || null;
  }

  async addActivationHistory(activation: ActivationHistory) {
    await this.activationHistory.add(activation);
  }

  async getCachedData(key: string, tenantId?: string): Promise<any> {
    const cached = await this.cache
      .where('key').equals(key)
      .and(item => !tenantId || item.tenantId === tenantId)
      .first();
    
    if (cached) {
      // Check if expired
      if (cached.expires && Date.now() > cached.expires) {
        await this.cache.delete(cached.id!);
        return null;
      }
      
      // Check TTL (fallback)
      if (!cached.expires && Date.now() - cached.timestamp > 300000) { // 5 minutes
        return null;
      }
      
      return cached.data;
    }
    return null;
  }

  async setCachedData(key: string, data: any, tenantId?: string, ttl: number = 300000) {
    await this.cache.put({
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      syncStatus: 'synced',
      tenantId,
      priority: key.includes('tenant') || key.includes('user') ? 'high' : 'medium',
    });
  }

  async cleanupExpiredCache() {
    const now = Date.now();
    await this.cache.where('expires').below(now).delete();
  }
}

export const db = new KisanShaktiDatabase();
