
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { Preferences } from '@capacitor/preferences';
import authSlice from './slices/authSlice';
import farmerSlice from './slices/farmerSlice';
import syncSlice from './slices/syncSlice';
import offlineSlice from './slices/offlineSlice';
import consolidatedSlice from './slices/consolidatedSlice';

// Custom storage for Capacitor
const capacitorStorage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

const persistConfig = {
  key: 'root',
  storage: capacitorStorage,
  // Only persist essential state - server data should be managed by React Query
  whitelist: ['auth', 'farmer', 'consolidated'],
};

// Simplified reducer structure - removed tenantSlice as it's now handled by React Query
const rootReducer = combineReducers({
  auth: authSlice,
  farmer: farmerSlice,
  sync: syncSlice,
  offline: offlineSlice,
  consolidated: consolidatedSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
