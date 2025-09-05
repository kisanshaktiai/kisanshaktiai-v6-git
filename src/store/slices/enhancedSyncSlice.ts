import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncProgress {
  current: number;
  total: number;
  message: string;
}

interface SyncMetrics {
  lastSyncTime: number | null;
  successfulSyncs: number;
  failedSyncs: number;
  pendingOperations: number;
  conflicts: number;
}

interface EnhancedSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  syncError: string | null;
  metrics: SyncMetrics;
  autoSync: boolean;
  syncInterval: number; // minutes
  conflictResolutionMode: 'auto' | 'manual';
}

const initialState: EnhancedSyncState = {
  isOnline: true,
  isSyncing: false,
  syncProgress: null,
  syncError: null,
  metrics: {
    lastSyncTime: null,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingOperations: 0,
    conflicts: 0
  },
  autoSync: true,
  syncInterval: 5,
  conflictResolutionMode: 'auto'
};

const enhancedSyncSlice = createSlice({
  name: 'enhancedSync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (!action.payload) {
        state.syncError = 'Device is offline';
      } else {
        state.syncError = null;
      }
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (!action.payload) {
        state.syncProgress = null;
      }
    },
    setSyncProgress: (state, action: PayloadAction<SyncProgress>) => {
      state.syncProgress = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
      if (action.payload) {
        state.metrics.failedSyncs++;
      }
    },
    updateSyncMetrics: (state, action: PayloadAction<Partial<SyncMetrics>>) => {
      state.metrics = {
        ...state.metrics,
        ...action.payload
      };
    },
    setAutoSync: (state, action: PayloadAction<boolean>) => {
      state.autoSync = action.payload;
    },
    setSyncInterval: (state, action: PayloadAction<number>) => {
      state.syncInterval = action.payload;
    },
    setConflictResolutionMode: (state, action: PayloadAction<'auto' | 'manual'>) => {
      state.conflictResolutionMode = action.payload;
    },
    incrementPendingOperations: (state) => {
      state.metrics.pendingOperations++;
    },
    decrementPendingOperations: (state) => {
      state.metrics.pendingOperations = Math.max(0, state.metrics.pendingOperations - 1);
    },
    incrementConflicts: (state) => {
      state.metrics.conflicts++;
    },
    resolveConflict: (state) => {
      state.metrics.conflicts = Math.max(0, state.metrics.conflicts - 1);
    },
    resetSyncState: (state) => {
      state.isSyncing = false;
      state.syncProgress = null;
      state.syncError = null;
    }
  }
});

export const {
  setOnlineStatus,
  setSyncInProgress,
  setSyncProgress,
  setSyncError,
  updateSyncMetrics,
  setAutoSync,
  setSyncInterval,
  setConflictResolutionMode,
  incrementPendingOperations,
  decrementPendingOperations,
  incrementConflicts,
  resolveConflict,
  resetSyncState
} = enhancedSyncSlice.actions;

export default enhancedSyncSlice.reducer;