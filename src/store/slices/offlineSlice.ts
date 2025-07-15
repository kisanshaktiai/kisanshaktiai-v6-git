
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OfflineState {
  cachedData: {
    crops: any[];
    markets: any[];
    weather: any;
    aiResponses: any[];
  };
  queuedActions: any[];
  offlineMode: boolean;
}

const initialState: OfflineState = {
  cachedData: {
    crops: [],
    markets: [],
    weather: null,
    aiResponses: [],
  },
  queuedActions: [],
  offlineMode: false,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setCachedCrops: (state, action: PayloadAction<any[]>) => {
      state.cachedData.crops = action.payload;
    },
    setCachedMarkets: (state, action: PayloadAction<any[]>) => {
      state.cachedData.markets = action.payload;
    },
    setCachedWeather: (state, action: PayloadAction<any>) => {
      state.cachedData.weather = action.payload;
    },
    addCachedAIResponse: (state, action: PayloadAction<any>) => {
      state.cachedData.aiResponses.push(action.payload);
    },
    queueAction: (state, action: PayloadAction<any>) => {
      state.queuedActions.push(action.payload);
    },
    removeQueuedAction: (state, action: PayloadAction<string>) => {
      state.queuedActions = state.queuedActions.filter(
        action => action.id !== action.payload
      );
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
  },
});

export const {
  setCachedCrops,
  setCachedMarkets,
  setCachedWeather,
  addCachedAIResponse,
  queueAction,
  removeQueuedAction,
  setOfflineMode,
} = offlineSlice.actions;

export default offlineSlice.reducer;
