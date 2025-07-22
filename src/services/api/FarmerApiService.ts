
import { ApiClient, API_CONFIG } from './ApiClient';
import type { ApiResponse } from './ApiClient';

interface FarmerProfile {
  id: string;
  farmer_code: string;
  mobile_number: string;
  name?: string;
  village?: string;
  district?: string;
  state?: string;
  total_land_acres?: number;
  primary_crops?: string[];
  farming_experience_years?: number;
  has_irrigation: boolean;
  has_tractor: boolean;
  has_storage: boolean;
  annual_income_range?: string;
  preferred_language: string;
}

interface LandRecord {
  id: string;
  farmer_id: string;
  land_area_acres: number;
  location_latitude?: number;
  location_longitude?: number;
  soil_type?: string;
  irrigation_type?: string;
  current_crop?: string;
  survey_number?: string;
  village?: string;
  district?: string;
  state?: string;
}

interface FinancialTransaction {
  id: string;
  farmer_id: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  description?: string;
  transaction_date: string;
  crop_name?: string;
  season?: string;
  land_id?: string;
}

class FarmerApiService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient({ baseUrl: API_CONFIG.baseUrl });
  }

  setAuthToken(token: string): void {
    this.apiClient.setAuthToken(token);
  }

  setTenantContext(tenantId: string): void {
    this.apiClient.setTenantId(tenantId);
  }

  // Profile Management
  async getProfile(): Promise<ApiResponse<FarmerProfile>> {
    return this.apiClient.get<FarmerProfile>('/api/farmer/profile');
  }

  async updateProfile(updates: Partial<FarmerProfile>): Promise<ApiResponse<FarmerProfile>> {
    return this.apiClient.put<FarmerProfile>('/api/farmer/profile', updates);
  }

  // Land Management
  async getLands(): Promise<ApiResponse<LandRecord[]>> {
    return this.apiClient.get<LandRecord[]>('/api/farmer/lands');
  }

  async createLand(landData: Omit<LandRecord, 'id' | 'farmer_id'>): Promise<ApiResponse<LandRecord>> {
    return this.apiClient.post<LandRecord>('/api/farmer/lands', landData);
  }

  async updateLand(landId: string, updates: Partial<LandRecord>): Promise<ApiResponse<LandRecord>> {
    return this.apiClient.put<LandRecord>(`/api/farmer/lands/${landId}`, updates);
  }

  async deleteLand(landId: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/api/farmer/lands/${landId}`);
  }

  // Financial Management
  async getTransactions(): Promise<ApiResponse<FinancialTransaction[]>> {
    return this.apiClient.get<FinancialTransaction[]>('/api/farmer/transactions');
  }

  async createTransaction(transactionData: Omit<FinancialTransaction, 'id' | 'farmer_id'>): Promise<ApiResponse<FinancialTransaction>> {
    return this.apiClient.post<FinancialTransaction>('/api/farmer/transactions', transactionData);
  }

  async deleteTransaction(transactionId: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/api/farmer/transactions/${transactionId}`);
  }

  // AI Chat
  async sendChatMessage(message: string, context?: any): Promise<ApiResponse<{ response: string }>> {
    return this.apiClient.post<{ response: string }>('/api/farmer/chat', {
      message,
      context
    });
  }

  // Weather Data
  async getWeatherData(latitude?: number, longitude?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (latitude) params.append('lat', latitude.toString());
    if (longitude) params.append('lng', longitude.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.apiClient.get<any>(`/api/farmer/weather${query}`);
  }
}

export const farmerApiService = new FarmerApiService();
export type { FarmerProfile, LandRecord, FinancialTransaction };
