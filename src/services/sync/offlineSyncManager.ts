
import { supabase } from '@/integrations/supabase/client';
import { localStorageService } from '../storage/localStorageService';

interface SyncOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 15000]; // Exponential backoff

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    localStorageService.addToSyncQueue(syncOperation);
    
    // Try immediate sync if online
    if (navigator.onLine) {
      setTimeout(() => this.processSyncQueue(), 100);
    }
  }

  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    const queue = localStorageService.getSyncQueue();
    
    // Sort by priority and timestamp
    const sortedQueue = queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || a.timestamp - b.timestamp;
    });

    for (const operation of sortedQueue) {
      try {
        await this.executeOperation(operation);
        localStorageService.removeSyncOperation(operation.id);
        
        // Dispatch sync success event
        window.dispatchEvent(new CustomEvent('sync-success', { 
          detail: { operation: operation.type, table: operation.table } 
        }));
      } catch (error) {
        await this.handleSyncError(operation, error);
      }
    }

    this.syncInProgress = false;
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    const { type, table, data } = operation;

    // Use type assertion to handle dynamic table names
    const tableRef = supabase.from(table as any);

    switch (type) {
      case 'insert':
        const { error: insertError } = await tableRef.insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await tableRef
          .update(data)
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await tableRef
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  private async handleSyncError(operation: SyncOperation, error: any): Promise<void> {
    operation.retryCount++;
    
    if (operation.retryCount >= this.maxRetries) {
      // Move to failed operations or remove
      localStorageService.removeSyncOperation(operation.id);
      
      // Dispatch sync failure event
      window.dispatchEvent(new CustomEvent('sync-failure', { 
        detail: { operation: operation.type, table: operation.table, error } 
      }));
      return;
    }

    // Schedule retry with exponential backoff
    const delay = this.retryDelays[operation.retryCount - 1] || 15000;
    setTimeout(() => {
      if (navigator.onLine) {
        this.processSyncQueue();
      }
    }, delay);
  }

  async forceSyncNow(): Promise<void> {
    if (navigator.onLine) {
      await this.processSyncQueue();
    }
  }

  getSyncStatus(): { pending: number; failed: number } {
    const queue = localStorageService.getSyncQueue();
    const pending = queue.filter(op => op.retryCount < this.maxRetries).length;
    const failed = queue.filter(op => op.retryCount >= this.maxRetries).length;
    
    return { pending, failed };
  }

  startBackgroundSync(): void {
    // Check for sync every 5 minutes when app is active
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, 5 * 60 * 1000);

    // Listen for connection restored event
    window.addEventListener('connection-restored', () => {
      this.processSyncQueue();
    });
  }
}

export const offlineSyncManager = OfflineSyncManager.getInstance();
