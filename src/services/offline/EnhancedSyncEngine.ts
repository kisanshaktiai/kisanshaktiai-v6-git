import { Network } from '@capacitor/network';
import { supabase } from '@/config/supabase';
import { db } from './db';
import { store } from '@/store';
import { 
  setSyncInProgress, 
  setSyncProgress, 
  setSyncError,
  updateSyncMetrics 
} from '@/store/slices/enhancedSyncSlice';
import { LocalNotifications } from '@capacitor/local-notifications';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'batch';
  entity: string;
  data: any;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  dependencies?: string[];
}

interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolver?: (local: any, remote: any) => any;
}

export class EnhancedSyncEngine {
  private static instance: EnhancedSyncEngine;
  private syncQueue: Map<string, SyncOperation> = new Map();
  private activeSyncs: Set<string> = new Set();
  private conflictHandlers: Map<string, ConflictResolution> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private retryBackoff = [1000, 5000, 15000, 60000]; // Exponential backoff
  private maxRetries = 4;
  private batchSize = 50;
  private isSyncing = false;

  private constructor() {
    this.initializeConflictHandlers();
    this.setupNetworkListener();
    this.setupPeriodicSync();
  }

  static getInstance(): EnhancedSyncEngine {
    if (!EnhancedSyncEngine.instance) {
      EnhancedSyncEngine.instance = new EnhancedSyncEngine();
    }
    return EnhancedSyncEngine.instance;
  }

  private initializeConflictHandlers() {
    // Define conflict resolution strategies per entity
    this.conflictHandlers.set('lands', {
      strategy: 'merge',
      resolver: (local, remote) => ({
        ...remote,
        ...local,
        updated_at: Math.max(local.updated_at, remote.updated_at)
      })
    });

    this.conflictHandlers.set('user_profiles', {
      strategy: 'client-wins' // User profile edits take precedence
    });

    this.conflictHandlers.set('crop_history', {
      strategy: 'server-wins' // Server data is authoritative for crop history
    });

    this.conflictHandlers.set('ai_conversations', {
      strategy: 'merge',
      resolver: (local, remote) => {
        const messages = [...(remote.messages || []), ...(local.messages || [])];
        const uniqueMessages = Array.from(
          new Map(messages.map(m => [m.id, m])).values()
        ).sort((a, b) => a.timestamp - b.timestamp);
        
        return {
          ...remote,
          messages: uniqueMessages,
          updated_at: Math.max(local.updated_at, remote.updated_at)
        };
      }
    });
  }

  private setupNetworkListener() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected && !this.isSyncing) {
        console.log('🌐 Network connected, starting sync...');
        await this.performSync();
      } else if (!status.connected) {
        console.log('📵 Network disconnected, entering offline mode');
        store.dispatch(setSyncError('Network disconnected'));
      }
    });
  }

  private setupPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(async () => {
      const status = await Network.getStatus();
      if (status.connected && !this.isSyncing) {
        await this.performSync();
      }
    }, 5 * 60 * 1000);
  }

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const id = `${operation.entity}_${operation.type}_${Date.now()}_${Math.random()}`;
    const syncOp: SyncOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.set(id, syncOp);
    
    // Persist to IndexedDB
    await db.syncQueue.add({
      operation: syncOp.type,
      table: syncOp.entity,
      data: syncOp.data,
      timestamp: syncOp.timestamp,
      status: 'pending',
      retryCount: 0,
      priority: syncOp.priority
    } as any);

    // Try immediate sync if online and high priority
    if (operation.priority === 'high') {
      const status = await Network.getStatus();
      if (status.connected) {
        await this.performSync();
      }
    }

    return id;
  }

  async performSync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    store.dispatch(setSyncInProgress(true));
    
    try {
      // Check network status
      const networkStatus = await Network.getStatus();
      if (!networkStatus.connected) {
        throw new Error('No network connection');
      }

      // Get pending operations from IndexedDB
      const pendingOps = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'error'])
        .toArray();

      const totalOps = pendingOps.length;
      if (totalOps === 0) {
        console.log('✅ No pending operations to sync');
        return;
      }

      console.log(`🔄 Starting sync for ${totalOps} operations`);
      
      // Sort by priority and dependencies
      const sortedOps = this.sortOperationsByPriority(pendingOps);
      
      // Process in batches
      for (let i = 0; i < sortedOps.length; i += this.batchSize) {
        const batch = sortedOps.slice(i, Math.min(i + this.batchSize, sortedOps.length));
        
        store.dispatch(setSyncProgress({
          current: i,
          total: totalOps,
          message: `Syncing ${Math.min(i + batch.length, totalOps)} of ${totalOps} operations`
        }));

        await this.processBatch(batch);
      }

      // Clean up completed operations
      await this.cleanupCompletedOperations();
      
      // Update sync metrics
      store.dispatch(updateSyncMetrics({
        lastSyncTime: Date.now(),
        successfulSyncs: totalOps,
        failedSyncs: 0
      }));

      // Show notification
      await this.showSyncNotification('Sync completed successfully', totalOps);

    } catch (error) {
      console.error('❌ Sync failed:', error);
      store.dispatch(setSyncError(error instanceof Error ? error.message : 'Sync failed'));
    } finally {
      this.isSyncing = false;
      store.dispatch(setSyncInProgress(false));
    }
  }

  private sortOperationsByPriority(operations: any[]): any[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return operations.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Sort by timestamp if same priority
      return a.timestamp - b.timestamp;
    });
  }

  private async processBatch(batch: any[]): Promise<void> {
    const results = await Promise.allSettled(
      batch.map(op => this.processSingleOperation(op))
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to sync operation ${batch[index].id}:`, result.reason);
      }
    });
  }

  private async processSingleOperation(operation: any): Promise<void> {
    try {
      const { table, operation: opType, data } = operation;
      
      // Check for conflicts
      if (opType === 'update') {
        const hasConflict = await this.checkForConflicts(table, data);
        if (hasConflict) {
          const resolved = await this.resolveConflict(table, data);
          operation.data = resolved;
        }
      }

      // Perform the actual sync
      let result;
      switch (opType) {
        case 'create':
          result = await supabase.from(table).insert(data);
          break;
        case 'update':
          result = await supabase.from(table).update(data).eq('id', data.id);
          break;
        case 'delete':
          result = await supabase.from(table).delete().eq('id', data.id);
          break;
        default:
          throw new Error(`Unknown operation type: ${opType}`);
      }

      if (result.error) {
        throw result.error;
      }

      // Mark as synced
      await db.syncQueue.update(operation.id, { status: 'synced' });
      
    } catch (error) {
      // Handle retry logic
      if (operation.retryCount < this.maxRetries) {
        await db.syncQueue.update(operation.id, {
          status: 'error',
          retryCount: operation.retryCount + 1
        });
        
        // Schedule retry with backoff
        const delay = this.retryBackoff[operation.retryCount] || 60000;
        setTimeout(() => this.retrySingleOperation(operation.id), delay);
      } else {
        // Max retries exceeded, mark as error with max retries
        await db.syncQueue.update(operation.id, {
          status: 'error',
          retryCount: this.maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error'
        } as any);
      }
      
      throw error;
    }
  }

  private async checkForConflicts(table: string, localData: any): Promise<boolean> {
    try {
      const { data: remoteData } = await supabase
        .from(table)
        .select('*')
        .eq('id', localData.id)
        .single();

      if (!remoteData) return false;

      // Check if remote has been updated after local
      const remoteUpdatedAt = new Date(remoteData.updated_at).getTime();
      const localUpdatedAt = new Date(localData.updated_at).getTime();
      
      return remoteUpdatedAt > localUpdatedAt;
    } catch {
      return false;
    }
  }

  private async resolveConflict(table: string, localData: any): Promise<any> {
    const resolution = this.conflictHandlers.get(table) || { strategy: 'client-wins' };
    
    try {
      const { data: remoteData } = await supabase
        .from(table)
        .select('*')
        .eq('id', localData.id)
        .single();

      if (!remoteData) return localData;

      switch (resolution.strategy) {
        case 'client-wins':
          return localData;
        
        case 'server-wins':
          return remoteData;
        
        case 'merge':
          if (resolution.resolver) {
            return resolution.resolver(localData, remoteData);
          }
          return { ...remoteData, ...localData };
        
        case 'manual':
          // Store conflict for manual resolution
          await this.storeConflictForManualResolution(table, localData, remoteData);
          return localData; // Default to local for now
        
        default:
          return localData;
      }
    } catch {
      return localData;
    }
  }

  private async storeConflictForManualResolution(table: string, localData: any, remoteData: any) {
    // Store in a conflicts table for user to resolve later
    await db.cache.add({
      key: `conflict_${table}_${localData.id}`,
      data: {
        table,
        localData,
        remoteData,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      syncStatus: 'pending',
      priority: 'high'
    });
  }

  private async retrySingleOperation(operationId: string) {
    const operation = await db.syncQueue.get(operationId);
    if (operation && operation.status === 'error') {
      await this.processSingleOperation(operation);
    }
  }

  private async cleanupCompletedOperations() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    await db.syncQueue
      .where('status').equals('synced')
      .and(item => item.timestamp < oneDayAgo)
      .delete();
  }

  private async showSyncNotification(message: string, count: number) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'KisanShakti AI',
          body: `${message} (${count} items)`,
          smallIcon: 'ic_sync',
          iconColor: '#10b981'
        }]
      });
    } catch (error) {
      console.log('Notification not available:', error);
    }
  }

  async getConflicts(): Promise<any[]> {
    const conflicts = await db.cache
      .where('key')
      .startsWith('conflict_')
      .toArray();
    
    return conflicts.map(c => c.data);
  }

  async resolveManualConflict(conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any) {
    const conflictKey = `conflict_${conflictId}`;
    const conflict = await db.cache.where('key').equals(conflictKey).first();
    
    if (!conflict) return;

    const { table, localData, remoteData } = conflict.data;
    let resolvedData: any;

    switch (resolution) {
      case 'local':
        resolvedData = localData;
        break;
      case 'remote':
        resolvedData = remoteData;
        break;
      case 'merged':
        resolvedData = mergedData || { ...remoteData, ...localData };
        break;
    }

    // Queue the resolved data for sync
    await this.queueOperation({
      type: 'update',
      entity: table,
      data: resolvedData,
      priority: 'high'
    });

    // Remove the conflict
    await db.cache.where('key').equals(conflictKey).delete();
  }

  dispose() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    Network.removeAllListeners();
  }
}

export const enhancedSyncEngine = EnhancedSyncEngine.getInstance();