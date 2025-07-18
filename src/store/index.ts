
import { configureStore } from '@reduxjs/toolkit';
import tenantReducer from './slices/tenantSlice';
import farmerReducer from './slices/farmerSlice';

export const store = configureStore({
  reducer: {
    tenant: tenantReducer,
    farmer: farmerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
