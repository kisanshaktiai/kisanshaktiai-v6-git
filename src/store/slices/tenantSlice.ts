
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionPlan } from '@/types/tenant';

interface TenantBranding {
  tenant_id?: string;
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  neutral_color?: string;
  muted_color?: string;
  gray_50?: string;
  gray_100?: string;
  gray_200?: string;
  gray_300?: string;
  gray_400?: string;
  gray_500?: string;
  gray_600?: string;
  gray_700?: string;
  gray_800?: string;
  gray_900?: string;
  feature_icons?: {
    ai_chat?: string;
    community?: string;
    smart_farming?: string;
    secure?: string;
  };
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

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

interface TenantState {
  currentTenant: TenantInfo | null;
  tenantBranding: TenantBranding | null;
  tenantFeatures: TenantFeatures | null;
  loading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  currentTenant: null,
  tenantBranding: {
    primary_color: '#8BC34A',
    secondary_color: '#4CAF50',
    accent_color: '#689F38',
    background_color: '#FFFFFF',
    text_color: '#1F2937',
    neutral_color: '#6B7280',
    muted_color: '#9CA3AF',
    gray_50: '#F9FAFB',
    gray_100: '#F3F4F6',
    gray_200: '#E5E7EB',
    gray_300: '#D1D5DB',
    gray_400: '#9CA3AF',
    gray_500: '#6B7280',
    gray_600: '#4B5563',
    gray_700: '#374151',
    gray_800: '#1F2937',
    gray_900: '#111827',
    app_name: 'KisanShakti AI',
    app_tagline: 'Your smart farming journey starts here',
    logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
  },
  tenantFeatures: null,
  loading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<TenantInfo>) => {
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
