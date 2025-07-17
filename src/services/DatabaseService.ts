// Centralized Database Service with Multi-Tenant Support
import { supabase } from '@/integrations/supabase/client';

export class DatabaseService {
  private static instance: DatabaseService;
  private currentTenant: string | null = null;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getCurrentTenant(): Promise<string | null> {
    if (this.currentTenant) return this.currentTenant;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userTenants } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      this.currentTenant = userTenants?.tenant_id || null;
      return this.currentTenant;
    } catch (error) {
      console.error('Error getting current tenant:', error);
      return null;
    }
  }

  // Generic method to ensure tenant_id is included in all inserts
  async insertWithTenant(table: string, data: any) {
    const tenantId = await this.getCurrentTenant();
    if (!tenantId) throw new Error('No active tenant found');

    return (supabase as any)
      .from(table)
      .insert({
        ...data,
        tenant_id: tenantId
      });
  }

  // Generic method to filter by tenant
  selectFromTable(table: string, columns = '*') {
    return (supabase as any)
      .from(table)
      .select(columns);
  }

  // Marketplace operations
  async getProducts(isActive = true, limit = 50) {
    const tenantId = await this.getCurrentTenant();
    if (!tenantId) throw new Error('No active tenant found');

    return supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', isActive)
      .limit(limit);
  }

  async getFeaturedProducts() {
    const tenantId = await this.getCurrentTenant();
    if (!tenantId) throw new Error('No active tenant found');

    return supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(10);
  }

  async getProduceListings(farmerId?: string) {
    const tenantId = await this.getCurrentTenant();
    if (!tenantId) throw new Error('No active tenant found');

    let query = supabase
      .from('produce_listings')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }
    return query.order('created_at', { ascending: false });
  }

  async saveMarketplaceItem(itemType: string, itemId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return this.insertWithTenant('marketplace_saved_items', {
      user_id: user.id,
      item_type: itemType,
      item_id: itemId
    });
  }

  // Land and Farm operations
  async getLands() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return this.selectFromTable('lands')
      .eq('farmer_id', user.id)
      .eq('is_active', true)
      .order('name');
  }

  async getNdviData(landId: string, limit = 30) {
    return this.selectFromTable('ndvi_data')
      .eq('land_id', landId)
      .order('date', { ascending: false })
      .limit(limit);
  }

  async getHealthAssessments(landId: string, limit = 10) {
    return this.selectFromTable('crop_health_assessments')
      .eq('land_id', landId)
      .order('assessment_date', { ascending: false })
      .limit(limit);
  }

  async getSatelliteImagery(landId: string, limit = 20) {
    return this.selectFromTable('satellite_imagery')
      .eq('land_id', landId)
      .order('acquisition_date', { ascending: false })
      .limit(limit);
  }

  async getSatelliteAlerts(landId: string) {
    return this.selectFromTable('satellite_alerts')
      .eq('land_id', landId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
  }

  async getPrescriptionMaps(landId: string) {
    return this.selectFromTable('prescription_maps')
      .eq('land_id', landId)
      .order('created_date', { ascending: false });
  }

  async createPrescriptionMap(data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return this.insertWithTenant('prescription_maps', {
      ...data,
      farmer_id: user.id
    });
  }

  // Analytics operations
  async getAnalyticsReports(farmerId?: string) {
    let query = this.selectFromTable('analytics_reports');
    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }
    return query.order('generated_at', { ascending: false });
  }

  async createAnalyticsReport(data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return this.insertWithTenant('analytics_reports', {
      ...data,
      farmer_id: user.id
    });
  }

  // Weather operations
  async getWeatherPreferences(farmerId: string) {
    return this.selectFromTable('weather_preferences')
      .eq('farmer_id', farmerId)
      .single();
  }

  async getWeatherAlerts() {
    return supabase
      .from('weather_alerts')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: false });
  }

  // Financial operations
  async getFinancialTransactions(farmerId: string) {
    return this.selectFromTable('financial_transactions')
      .eq('farmer_id', farmerId)
      .order('transaction_date', { ascending: false });
  }

  async createFinancialTransaction(data: any) {
    return this.insertWithTenant('financial_transactions', data);
  }

  // Generic CRUD operations with tenant isolation
  async create(table: string, data: any) {
    return this.insertWithTenant(table, data);
  }

  async read(table: string, filters: Record<string, any> = {}) {
    let query = this.selectFromTable(table);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return query;
  }

  async update(table: string, id: string, data: any) {
    const tenantId = await this.getCurrentTenant();
    if (!tenantId) throw new Error('No active tenant found');

    return (supabase as any)
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId);
  }

  async delete(table: string, id: string) {
    const tenantId = await this.getCurrentTenant();
    if (!tenantId) throw new Error('No active tenant found');

    return (supabase as any)
      .from(table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
  }

  // Clear cached tenant (useful for tenant switching)
  clearTenantCache() {
    this.currentTenant = null;
  }
}

export const dbService = DatabaseService.getInstance();