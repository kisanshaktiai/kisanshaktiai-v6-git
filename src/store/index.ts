
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { Preferences } from '@capacitor/preferences';
import authSlice from './slices/authSlice';
import farmerSlice from './slices/farmerSlice';
import syncSlice from './slices/syncSlice';
import offlineSlice from './slices/offlineSlice';

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
  whitelist: ['auth', 'farmer', 'offline'],
};

const rootReducer = {
  auth: authSlice,
  farmer: farmerSlice,
  sync: syncSlice,
  offline: offlineSlice,
};

const persistedReducer = persistReducer(persistConfig, (state = {}, action) => {
  return Object.entries(rootReducer).reduce((acc, [key, reducer]) => {
    acc[key] = reducer(state[key], action);
    return acc;
  }, {} as any);
});

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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
