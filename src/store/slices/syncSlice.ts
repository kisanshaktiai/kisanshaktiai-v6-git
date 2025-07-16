
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncTime: string | null;
  pendingOperations: number;
  failedOperations: number;
}

const initialState: SyncState = {
  isOnline: true,
  syncInProgress: false,
  lastSyncTime: null,
  pendingOperations: 0,
  failedOperations: 0,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    setPendingOperations: (state, action: PayloadAction<number>) => {
      state.pendingOperations = action.payload;
    },
    setFailedOperations: (state, action: PayloadAction<number>) => {
      state.failedOperations = action.payload;
    },
    incrementPending: (state) => {
      state.pendingOperations += 1;
    },
    decrementPending: (state) => {
      state.pendingOperations = Math.max(0, state.pendingOperations - 1);
    },
    incrementFailed: (state) => {
      state.failedOperations += 1;
    },
  },
});

export const {
  setOnlineStatus,
  setSyncInProgress,
  setLastSyncTime,
  setPendingOperations,
  setFailedOperations,
  incrementPending,
  decrementPending,
  incrementFailed,
} = syncSlice.actions;

export default syncSlice.reducer;
