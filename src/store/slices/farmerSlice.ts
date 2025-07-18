
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FarmerProfile {
  id: string;
  name: string;
  phone_number: string;
  tenant_id: string | null;
  location: any;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

interface FarmerState {
  profile: FarmerProfile | null;
  tenantId: string | null;
}

const initialState: FarmerState = {
  profile: null,
  tenantId: null,
};

const farmerSlice = createSlice({
  name: 'farmer',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<FarmerProfile>) => {
      state.profile = action.payload;
    },
    setTenantId: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
    },
    clearFarmer: (state) => {
      state.profile = null;
      state.tenantId = null;
    },
  },
});

export const { setProfile, setTenantId, clearFarmer } = farmerSlice.actions;
export default farmerSlice.reducer;
