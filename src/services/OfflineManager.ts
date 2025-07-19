
import { Network } from '@capacitor/network';
import { db, SyncQueueItem } from './offline/db';
import { supabase } from '@/integrations/supabase/client';
import { tenantManager } from './TenantManager';

interface OfflineConfig {
  maxRetries: number;
  retryDelay: number;
  syncInterval: number;
  cacheExpiry: number;
}

class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private config: OfflineConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    syncInterval: 30000,
    cacheExpiry: 300000 // 5 minutes
  };

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('OfflineManager: Initializing...');

    // Check initial network status
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    // Listen for network changes
    Network.addListener('networkStatusChange', (status) => {
      const wasOffline = !this.isOnline;
      this.isOnline = status.connected;
      
      console.log('OfflineManager: Network status changed:', status.connected ? 'online' : 'offline');
      
      // If we just came online, start sync
      if (wasOffline && this.isOnline) {
        this.startSync();
      }
      
      // Dispatch network status event
      window.dispatchEvent(new CustomEvent('network-status-change', {
        detail: { isOnline: this.isOnline }
      }));
    });

    // Start periodic sync if online
    if (this.isOnline) {
      this.startPeriodicSync();
    }

    console.log('OfflineManager: Initialized, network status:', this.isOnline ? 'online' : 'offline');
  }

  private startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.startSync();
      }
    }, this.config.syncInterval);
  }

  async startSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('OfflineManager: Starting sync...');

    try {
      // Get pending sync items
      const pendingItems = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'error'])
        .and(item => item.retryCount < this.config.maxRetries)
        .toArray();

      console.log(`OfflineManager: Found ${pendingItems.length} items to sync`);

      for (const item of pendingItems) {
        await this.processSyncItem(item);
      }

      // Clean up old successful syncs
      await this.cleanupSyncQueue();

      console.log('OfflineManager: Sync completed successfully');

    } catch (error) {
      console.error('OfflineManager: Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    try {
      console.log('OfflineManager: Processing sync item:', item.operation, item.table);

      // Update status to syncing
      await db.syncQueue.update(item.id!, { status: 'syncing' });

      // Add tenant_id to data if not present
      const tenantId = tenantManager.getCurrentTenantId();
      const dataWithTenant = {
        ...item.data,
        tenant_id: item.tenantId || tenantId
      };

      let result;
      
      // Use type assertion to bypass TypeScript's strict table name checking
      // This is safe because we're validating table names at runtime
      const supabaseTable = (supabase as any).from(item.table);
      
      switch (item.operation) {
        case 'create':
          result = await supabaseTable.insert(dataWithTenant);
          break;
        case 'update':
          result = await supabaseTable
            .update(dataWithTenant)
            .eq('id', item.data.id);
          break;
        case 'delete':
          result = await supabaseTable
            .delete()
            .eq('id', item.data.id);
          break;
        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      if (result.error) {
        throw result.error;
      }

      // Mark as synced
      await db.syncQueue.update(item.id!, { 
        status: 'synced',
        retryCount: 0
      });

      console.log('OfflineManager: Successfully synced item:', item.id);

    } catch (error) {
      console.error('OfflineManager: Failed to sync item:', item.id, error);
      
      // Update retry count and status
      await db.syncQueue.update(item.id!, {
        status: 'error',
        retryCount: (item.retryCount || 0) + 1
      });
    }
  }

  private async cleanupSyncQueue(): Promise<void> {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    await db.syncQueue
      .where('status')
      .equals('synced')
      .and(item => item.timestamp < oneDayAgo)
      .delete();
  }

  // Public API
  async queueForSync(
    operation: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ): Promise<void> {
    const tenantId = tenantManager.getCurrentTenantId();
    
    await db.syncQueue.add({
      operation,
      table,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      tenantId
    });

    // Try immediate sync if online
    if (this.isOnline) {
      setTimeout(() => this.startSync(), 100);
    }

    console.log('OfflineManager: Queued for sync:', operation, table);
  }

  async getCachedData(key: string): Promise<any> {
    const tenantId = tenantManager.getCurrentTenantId();
    return await db.getCachedData(key, tenantId);
  }

  async setCachedData(key: string, data: any): Promise<void> {
    const tenantId = tenantManager.getCurrentTenantId();
    await db.setCachedData(key, data, tenantId);
  }

  async getSyncStatus(): Promise<{ pending: number; errors: number }> {
    const pending = await db.syncQueue.where('status').equals('pending').count();
    const errors = await db.syncQueue.where('status').equals('error').count();
    return { pending, errors };
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

export const offlineManager = OfflineManager.getInstance();
