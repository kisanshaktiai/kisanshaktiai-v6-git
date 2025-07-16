
import Dexie, { Table } from 'dexie';

export interface CachedData {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'error';
  tenantId?: string;
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

class KisanShaktiDatabase extends Dexie {
  cache!: Table<CachedData>;
  syncQueue!: Table<SyncQueueItem>;
  farmers!: Table<OfflineFarmer>;
  lands!: Table<OfflineLand>;
  
  constructor() {
    super('KisanShaktiDB');
    this.version(1).stores({
      cache: '++id, key, timestamp, syncStatus, tenantId',
      syncQueue: '++id, operation, table, timestamp, status, tenantId',
      farmers: 'id, phone, tenantId, lastSync',
      lands: 'id, farmerId, tenantId, lastSync',
    });
  }

  async clearTenantData(tenantId: string) {
    await this.transaction('rw', this.cache, this.syncQueue, this.farmers, this.lands, async () => {
      await this.cache.where('tenantId').equals(tenantId).delete();
      await this.syncQueue.where('tenantId').equals(tenantId).delete();
      await this.farmers.where('tenantId').equals(tenantId).delete();
      await this.lands.where('tenantId').equals(tenantId).delete();
    });
  }

  async getCachedData(key: string, tenantId?: string): Promise<any> {
    const cached = await this.cache
      .where('key').equals(key)
      .and(item => !tenantId || item.tenantId === tenantId)
      .first();
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data;
    }
    return null;
  }

  async setCachedData(key: string, data: any, tenantId?: string) {
    await this.cache.put({
      key,
      data,
      timestamp: Date.now(),
      syncStatus: 'synced',
      tenantId,
    });
  }
}

export const db = new KisanShaktiDatabase();
