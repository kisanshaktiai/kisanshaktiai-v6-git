
import { supabase } from '@/integrations/supabase/client';
import { tenantService } from './TenantService';

export interface Product {
  id: string;
  tenant_id: string;
  name: any; // JSON object with translations
  description?: any;
  brand?: string;
  price?: number;
  currency?: string;
  availability_status: string;
  bulk_pricing?: any;
  category_id?: string;
  credit_options?: any;
  dealer_locations?: any;
  discount_percentage?: number;
  expected_delivery_days?: number;
  images?: string[];
  is_active: boolean;
  is_featured?: boolean;
  minimum_order_quantity?: number;
  product_code?: string;
  specifications?: any;
  stock_quantity?: number;
  tags?: string[];
  unit?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketPrice {
  id: string;
  crop_name: string;
  variety?: string;
  market_location: string;
  district?: string;
  state?: string;
  price_per_unit: number;
  unit: string;
  price_date: string;
  price_type: string;
  quality_grade?: string;
  source: string;
  metadata?: any;
  created_at: string;
}

export class MarketplaceService {
  private static instance: MarketplaceService;

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  async getProducts(limit: number = 20): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  async getMarketPrices(limit: number = 20): Promise<MarketPrice[]> {
    try {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching market prices:', error);
      return [];
    }
  }

  async getMarketPricesByCrop(cropName: string): Promise<MarketPrice[]> {
    try {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('crop_name', cropName)
        .order('price_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching market prices by crop:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantService.getCurrentTenantId())
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  getProductName(product: Product, language: string = 'hi'): string {
    if (typeof product.name === 'string') {
      return product.name;
    }
    return product.name?.[language] || product.name?.['en'] || 'Unknown Product';
  }

  getProductDescription(product: Product, language: string = 'hi'): string {
    if (typeof product.description === 'string') {
      return product.description;
    }
    return product.description?.[language] || product.description?.['en'] || '';
  }

  formatPrice(price: number, currency: string = 'INR'): string {
    if (currency === 'INR') {
      return `₹${price.toLocaleString('en-IN')}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  }
}

export const marketplaceService = MarketplaceService.getInstance();
