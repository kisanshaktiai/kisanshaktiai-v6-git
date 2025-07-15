
import { Network } from '@capacitor/network';
import { store } from '@/store';
import { setOnlineStatus, setSyncInProgress, setLastSyncTime } from '@/store/slices/syncSlice';

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize(): Promise<void> {
    // Monitor network status
    Network.addListener('networkStatusChange', (status) => {
      store.dispatch(setOnlineStatus(status.connected));
      
      if (status.connected && !this.syncInProgress) {
        this.startSync();
      }
    });

    // Check initial network status
    const status = await Network.getStatus();
    store.dispatch(setOnlineStatus(status.connected));
  }

  async startSync(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    store.dispatch(setSyncInProgress(true));

    try {
      await this.syncPendingActions();
      await this.syncData();
      
      store.dispatch(setLastSyncTime(new Date().toISOString()));
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      store.dispatch(setSyncInProgress(false));
    }
  }

  private async syncPendingActions(): Promise<void> {
    const state = store.getState();
    // Safely access the offline state with optional chaining
    const pendingActions = (state as any)?.offline?.queuedActions || [];

    for (const action of pendingActions) {
      try {
        // Process pending action
        await this.processAction(action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
  }

  private async syncData(): Promise<void> {
    // Sync farmer profile, lands, crops, etc.
    try {
      // This would integrate with your Supabase sync logic
      console.log('Syncing data...');
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }

  private async processAction(action: any): Promise<void> {
    // Process individual queued actions
    console.log('Processing action:', action);
  }
}
