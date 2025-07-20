import { db, SyncQueueItem } from './db';
import { supabase } from '../../config/supabase';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private retryTimeout: NodeJS.Timeout | null = null;
  private networkListener: any = null;
  private isOnline = true;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  private syncBatchSize = 10;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize() {
    console.log('SyncService: Initializing...');
    
    try {
      // Check if we're in a native environment
      if (Capacitor.isNativePlatform()) {
        // Get initial network status
        const status = await Network.getStatus();
        this.isOnline = status.connected;
        console.log('SyncService: Initial network status:', this.isOnline ? 'online' : 'offline');

        // Listen for network changes
        this.networkListener = await Network.addListener('networkStatusChange', (status) => {
          const wasOffline = !this.isOnline;
          this.isOnline = status.connected;
          
          console.log('SyncService: Network status changed:', this.isOnline ? 'online' : 'offline');
          
          // If we just came online, start sync after a short delay
          if (wasOffline && this.isOnline) {
            setTimeout(() => {
              this.startSync();
            }, 1000);
          }
        });
      } else {
        // For web environment, assume online and use navigator.onLine
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
          console.log('SyncService: Browser came online');
          this.isOnline = true;
          setTimeout(() => {
            this.startSync();
          }, 1000);
        });
        
        window.addEventListener('offline', () => {
          console.log('SyncService: Browser went offline');
          this.isOnline = false;
        });
      }

      // Start initial sync if online
      if (this.isOnline) {
        // Delay initial sync to allow app to fully initialize
        setTimeout(() => {
          this.startSync();
        }, 2000);
      }

      // Set up periodic sync (every 5 minutes when online)
      setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.startSync();
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('SyncService: Initialization error:', error);
      // Fallback to web mode
      this.isOnline = navigator.onLine;
    }
  }

  async addToQueue(operation: 'create' | 'update' | 'delete', table: string, data: any, tenantId?: string) {
    try {
      const queueItem: Omit<SyncQueueItem, 'id'> = {
        operation,
        table,
        data,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
        tenantId,
      };

      await db.syncQueue.add(queueItem);
      console.log('SyncService: Added to queue:', operation, table, data.id || 'new');

      // Try to sync immediately if online
      if (this.isOnline && !this.syncInProgress) {
        // Small delay to allow multiple rapid operations to batch together
        setTimeout(() => {
          this.startSync();
        }, 500);
      }
    } catch (error) {
      console.error('SyncService: Error adding to queue:', error);
    }
  }

  private async startSync() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('SyncService: Starting sync...');
    
    try {
      // Get pending items in batches to avoid overwhelming the system
      const pendingItems = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'error'])
        .and(item => (item.retryCount || 0) < this.maxRetries)
        .limit(this.syncBatchSize)
        .toArray();

      if (pendingItems.length === 0) {
        console.log('SyncService: No items to sync');
        return;
      }

      console.log(`SyncService: Found ${pendingItems.length} items to sync`);

      // Process items in parallel but with controlled concurrency
      const batchPromises = pendingItems.map(item => this.processQueueItem(item));
      await Promise.allSettled(batchPromises);

      // Clean up successfully synced items older than 24 hours
      await this.cleanupSyncQueue();

      // If there are more pending items, schedule another sync
      const remainingItems = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'error'])
        .and(item => (item.retryCount || 0) < this.maxRetries)
        .count();

      if (remainingItems > 0) {
        console.log(`SyncService: ${remainingItems} items remaining, scheduling next sync`);
        setTimeout(() => {
          this.startSync();
        }, 1000);
      } else {
        console.log('SyncService: All items synced successfully');
      }

    } catch (error) {
      console.error('SyncService: Sync error:', error);
    } finally {
      this.syncInProgress = false;
      
      // Schedule retry for failed items if any exist
      this.scheduleRetryForFailedItems();
    }
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    try {
      console.log('SyncService: Processing item:', item.operation, item.table, item.data.id || 'new');

      // Update status to syncing
      if (item.id) {
        await db.syncQueue.update(item.id, { status: 'syncing' });
      }

      // Perform the actual sync operation
      await this.performSyncOperation(item);

      // Mark as synced
      if (item.id) {
        await db.syncQueue.update(item.id, { 
          status: 'synced',
          retryCount: 0
        });
      }

      console.log('SyncService: Successfully synced item:', item.id);

    } catch (error) {
      console.error('SyncService: Failed to sync item:', item.id, error);
      
      const newRetryCount = (item.retryCount || 0) + 1;
      
      // Update retry count and status
      if (item.id) {
        const newStatus = newRetryCount >= this.maxRetries ? 'failed' : 'error';
        await db.syncQueue.update(item.id, { 
          status: newStatus, 
          retryCount: newRetryCount 
        });
      }
    }
  }

  private async performSyncOperation(item: SyncQueueItem): Promise<void> {
    const { operation, table, data } = item;

    // Add error handling for network issues
    try {
      switch (table) {
        case 'farmers':
          await this.syncFarmerData(operation, data);
          break;
        case 'lands':
          await this.syncLandData(operation, data);
          break;
        case 'crop_history':
          await this.syncCropHistoryData(operation, data);
          break;
        case 'land_activities':
          await this.syncLandActivitiesData(operation, data);
          break;
        case 'financial_transactions':
          await this.syncFinancialTransactionData(operation, data);
          break;
        case 'crop_health_assessments':
          await this.syncCropHealthAssessmentData(operation, data);
          break;
        default:
          console.warn('SyncService: Unknown table for sync:', table);
          throw new Error(`Unsupported table: ${table}`);
      }
    } catch (error) {
      // Check if it's a network error and we should retry
      if (this.isNetworkError(error)) {
        throw new Error('Network error during sync operation');
      }
      throw error;
    }
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.message?.includes('fetch') ||
      error?.message?.includes('network') ||
      error?.code === 'NETWORK_ERROR' ||
      !this.isOnline
    );
  }

  private async syncFarmerData(operation: string, data: any) {
    const { error } = await this.executeSupabaseOperation('farmers', operation, data);
    if (error) throw error;
  }

  private async syncLandData(operation: string, data: any) {
    const { error } = await this.executeSupabaseOperation('lands', operation, data);
    if (error) throw error;
  }

  private async syncCropHistoryData(operation: string, data: any) {
    const { error } = await this.executeSupabaseOperation('crop_history', operation, data);
    if (error) throw error;
  }

  private async syncLandActivitiesData(operation: string, data: any) {
    const { error } = await this.executeSupabaseOperation('land_activities', operation, data);
    if (error) throw error;
  }

  private async syncFinancialTransactionData(operation: string, data: any) {
    const { error } = await this.executeSupabaseOperation('financial_transactions', operation, data);
    if (error) throw error;
  }

  private async syncCropHealthAssessmentData(operation: string, data: any) {
    const { error } = await this.executeSupabaseOperation('crop_health_assessments', operation, data);
    if (error) throw error;
  }

  private async executeSupabaseOperation(table: string, operation: string, data: any) {
    switch (operation) {
      case 'create':
        return await supabase.from(table).insert(data);
      case 'update':
        return await supabase.from(table).update(data).eq('id', data.id);
      case 'delete':
        return await supabase.from(table).delete().eq('id', data.id);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private async cleanupSyncQueue() {
    try {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const deletedCount = await db.syncQueue
        .where('status').equals('synced')
        .and(item => item.timestamp < oneDayAgo)
        .delete();

      if (deletedCount > 0) {
        console.log(`SyncService: Cleaned up ${deletedCount} old sync records`);
      }
    } catch (error) {
      console.error('SyncService: Error cleaning up sync queue:', error);
    }
  }

  private async scheduleRetryForFailedItems() {
    try {
      const failedItems = await db.syncQueue
        .where('status').equals('error')
        .and(item => (item.retryCount || 0) < this.maxRetries)
        .count();

      if (failedItems > 0 && this.isOnline) {
        console.log(`SyncService: Scheduling retry for ${failedItems} failed items`);
        
        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
        }

        // Exponential backoff for retries
        const retryDelay = this.retryDelay * Math.pow(2, Math.min(3, failedItems - 1));
        
        this.retryTimeout = setTimeout(() => {
          this.startSync();
        }, retryDelay);
      }
    } catch (error) {
      console.error('SyncService: Error scheduling retry:', error);
    }
  }

  async getQueueStatus() {
    try {
      const pending = await db.syncQueue.where('status').equals('pending').count();
      const syncing = await db.syncQueue.where('status').equals('syncing').count();
      const errors = await db.syncQueue.where('status').equals('error').count();
      const failed = await db.syncQueue.where('status').equals('failed').count();
      
      return { 
        pending: pending + syncing, 
        errors: errors + failed,
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress
      };
    } catch (error) {
      console.error('SyncService: Error getting queue status:', error);
      return { pending: 0, errors: 0, isOnline: this.isOnline, syncInProgress: this.syncInProgress };
    }
  }

  async forcSync() {
    console.log('SyncService: Force sync requested');
    if (this.isOnline) {
      await this.startSync();
    } else {
      console.log('SyncService: Cannot force sync while offline');
    }
  }

  async clearFailedItems() {
    try {
      const deletedCount = await db.syncQueue
        .where('status').equals('failed')
        .delete();
      
      console.log(`SyncService: Cleared ${deletedCount} failed items`);
      return deletedCount;
    } catch (error) {
      console.error('SyncService: Error clearing failed items:', error);
      return 0;
    }
  }

  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  async destroy() {
    console.log('SyncService: Destroying...');
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.networkListener) {
      this.networkListener.remove();
      this.networkListener = null;
    }
  }
}

export const syncService = SyncService.getInstance();
