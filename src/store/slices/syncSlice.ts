
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingActions: any[];
  syncInProgress: boolean;
  syncErrors: string[];
}

const initialState: SyncState = {
  isOnline: true,
  lastSyncTime: null,
  pendingActions: [],
  syncInProgress: false,
  syncErrors: [],
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addPendingAction: (state, action: PayloadAction<any>) => {
      state.pendingActions.push(action.payload);
    },
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(
        action => action.id !== action.payload
      );
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    addSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors.push(action.payload);
    },
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  setSyncInProgress,
  setLastSyncTime,
  addSyncError,
  clearSyncErrors,
} = syncSlice.actions;

export default syncSlice.reducer;
