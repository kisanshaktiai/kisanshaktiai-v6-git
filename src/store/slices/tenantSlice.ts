
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
}

interface TenantFeatures {
  ai_chat?: boolean;
  weather_forecast?: boolean;
  marketplace?: boolean;
  basic_analytics?: boolean;
  community_forum?: boolean;
  satellite_imagery?: boolean;
  soil_testing?: boolean;
  drone_monitoring?: boolean;
  iot_integration?: boolean;
  ecommerce?: boolean;
  payment_gateway?: boolean;
  inventory_management?: boolean;
  logistics_tracking?: boolean;
}

interface TenantState {
  currentTenant: any | null;
  tenantBranding: TenantBranding | null;
  tenantFeatures: TenantFeatures | null;
  loading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  currentTenant: null,
  tenantBranding: null,
  tenantFeatures: null,
  loading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<any>) => {
      state.currentTenant = action.payload;
    },
    setTenantBranding: (state, action: PayloadAction<TenantBranding>) => {
      state.tenantBranding = action.payload;
    },
    setTenantFeatures: (state, action: PayloadAction<TenantFeatures>) => {
      state.tenantFeatures = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearTenantData: (state) => {
      state.currentTenant = null;
      state.tenantBranding = null;
      state.tenantFeatures = null;
      state.error = null;
    },
  },
});

export const {
  setCurrentTenant,
  setTenantBranding,
  setTenantFeatures,
  setLoading,
  setError,
  clearTenantData,
} = tenantSlice.actions;

export default tenantSlice.reducer;
