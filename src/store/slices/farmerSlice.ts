
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Farmer } from '@/types/database';

interface FarmerState {
  profile: Farmer | null;
  selectedLanguage: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
    state?: string;
  } | null;
  tenantId: string | null;
  lands: any[];
  crops: any[];
}

const initialState: FarmerState = {
  profile: null,
  selectedLanguage: 'hi',
  location: null,
  tenantId: null,
  lands: [],
  crops: [],
};

const farmerSlice = createSlice({
  name: 'farmer',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Farmer>) => {
      state.profile = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.selectedLanguage = action.payload;
    },
    setLocation: (state, action: PayloadAction<FarmerState['location']>) => {
      state.location = action.payload;
    },
    setTenantId: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
    },
    setLands: (state, action: PayloadAction<any[]>) => {
      state.lands = action.payload;
    },
    setCrops: (state, action: PayloadAction<any[]>) => {
      state.crops = action.payload;
    },
  },
});

export const { 
  setProfile, 
  setLanguage, 
  setLocation, 
  setTenantId, 
  setLands, 
  setCrops 
} = farmerSlice.actions;

export default farmerSlice.reducer;
