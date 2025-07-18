import { supabase } from '@/integrations/supabase/client';
import { tenantService } from './TenantService';
import { DEFAULT_TENANT_ID } from '@/config/constants';

export interface FarmerRegistrationData {
  mobile_number: string;
  pin_hash: string;
  farmer_code?: string;
  tenant_id?: string;
}

export interface FarmerProfile {
  id: string;
  tenant_id: string;
  farmer_code: string;
  mobile_number: string;
  pin_hash?: string;
  total_land_acres?: number;
  farming_experience_years?: number;
  farm_type?: string;
  primary_crops?: string[];
  annual_income_range?: string;
  has_irrigation?: boolean;
  has_tractor?: boolean;
  has_storage?: boolean;
  irrigation_type?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export class FarmerService {
  private static instance: FarmerService;

  static getInstance(): FarmerService {
    if (!FarmerService.instance) {
      FarmerService.instance = new FarmerService();
    }
    return FarmerService.instance;
  }

  async registerFarmer(registrationData: FarmerRegistrationData): Promise<FarmerProfile> {
    try {
      const tenantId = registrationData.tenant_id || tenantService.getCurrentTenantId();
      
      // Generate farmer code if not provided
      const farmerCode = registrationData.farmer_code || 
        `F${Date.now()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { data, error } = await supabase
        .from('farmers')
        .insert({
          tenant_id: tenantId,
          mobile_number: registrationData.mobile_number,
          pin_hash: registrationData.pin_hash,
          farmer_code: farmerCode,
          app_install_date: new Date().toISOString().split('T')[0],
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering farmer:', error);
      throw error;
    }
  }

  async getFarmerByMobile(mobileNumber: string): Promise<FarmerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching farmer by mobile:', error);
      return null;
    }
  }

  async getFarmerById(farmerId: string): Promise<FarmerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', farmerId)
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching farmer by ID:', error);
      return null;
    }
  }

  async updateFarmerProfile(farmerId: string, updateData: Partial<FarmerProfile>): Promise<FarmerProfile> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId)
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating farmer profile:', error);
      throw error;
    }
  }

  async getAllFarmers(): Promise<FarmerProfile[]> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all farmers:', error);
      return [];
    }
  }

  async verifyFarmer(farmerId: string): Promise<FarmerProfile> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', farmerId)
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying farmer:', error);
      throw error;
    }
  }

  generateFarmerCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `F${timestamp}_${random}`;
  }

  async getDashboardStats() {
    try {
      const tenantId = tenantService.getCurrentTenantId();
      
      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('id, is_verified, total_land_acres')
        .eq('tenant_id', tenantId);

      if (farmersError) throw farmersError;

      const { data: lands, error: landsError } = await supabase
        .from('lands')
        .select('area_acres')
        .eq('tenant_id', tenantId);

      if (landsError) throw landsError;

      const totalFarmers = farmers?.length || 0;
      const verifiedFarmers = farmers?.filter(f => f.is_verified)?.length || 0;
      const totalLandArea = lands?.reduce((sum, land) => sum + (land.area_acres || 0), 0) || 0;

      return {
        totalFarmers,
        verifiedFarmers,
        totalLandArea: Math.round(totalLandArea * 100) / 100,
        verificationRate: totalFarmers > 0 ? Math.round((verifiedFarmers / totalFarmers) * 100) : 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalFarmers: 0,
        verifiedFarmers: 0,
        totalLandArea: 0,
        verificationRate: 0
      };
    }
  }
}

export const farmerService = FarmerService.getInstance();
