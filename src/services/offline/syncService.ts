
import { db, SyncQueueItem } from './db';
import { supabase } from '../../config/supabase';
import { Network } from '@capacitor/network';

class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private retryTimeout: NodeJS.Timeout | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize() {
    // Listen for network changes
    Network.addListener('networkStatusChange', (status) => {
      if (status.connected && !this.syncInProgress) {
        this.startSync();
      }
    });

    // Initial sync if online
    const status = await Network.getStatus();
    if (status.connected) {
      this.startSync();
    }
  }

  async addToQueue(operation: 'create' | 'update' | 'delete', table: string, data: any, tenantId?: string) {
    await db.syncQueue.add({
      operation,
      table,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      tenantId,
    });

    // Try to sync immediately if online
    const status = await Network.getStatus();
    if (status.connected) {
      this.startSync();
    }
  }

  private async startSync() {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .or('status')
        .equals('error')
        .toArray();

      for (const item of pendingItems) {
        try {
          await this.processQueueItem(item);
          await db.syncQueue.update(item.id!, { status: 'synced' });
        } catch (error) {
          console.error('Sync error for item:', item, error);
          await db.syncQueue.update(item.id!, { 
            status: 'error', 
            retryCount: (item.retryCount || 0) + 1 
          });
        }
      }

      // Clean up successfully synced items older than 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      await db.syncQueue
        .where('status').equals('synced')
        .and(item => item.timestamp < oneDayAgo)
        .delete();

    } finally {
      this.syncInProgress = false;
      
      // Schedule retry for failed items
      this.scheduleRetry();
    }
  }

  private async processQueueItem(item: SyncQueueItem) {
    const { operation, table, data } = item;

    switch (table) {
      case 'farmers':
        await this.syncFarmerData(operation, data);
        break;
      case 'lands':
        await this.syncLandData(operation, data);
        break;
      default:
        console.warn('Unknown table for sync:', table);
    }
  }

  private async syncFarmerData(operation: string, data: any) {
    switch (operation) {
      case 'create':
        await supabase.from('farmers').insert(data);
        break;
      case 'update':
        await supabase.from('farmers').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('farmers').delete().eq('id', data.id);
        break;
    }
  }

  private async syncLandData(operation: string, data: any) {
    switch (operation) {
      case 'create':
        await supabase.from('lands').insert(data);
        break;
      case 'update':
        await supabase.from('lands').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('lands').delete().eq('id', data.id);
        break;
    }
  }

  private scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Retry failed items after 5 minutes
    this.retryTimeout = setTimeout(() => {
      this.startSync();
    }, 5 * 60 * 1000);
  }

  async getQueueStatus() {
    const pending = await db.syncQueue.where('status').equals('pending').count();
    const errors = await db.syncQueue.where('status').equals('error').count();
    return { pending, errors };
  }
}

export const syncService = SyncService.getInstance();
