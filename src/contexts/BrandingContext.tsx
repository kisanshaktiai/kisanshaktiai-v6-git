
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TenantBranding {
  id: string;
  name: string;
  appName: string;
  tagline: string;
  logo: string;
  splashLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  subdomain?: string;
  customDomain?: string;
  features: string[];
}

interface BrandingContextType {
  branding: TenantBranding;
  loading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const defaultBranding: TenantBranding = {
  id: 'default',
  name: 'KisanShakti AI',
  appName: 'KisanShakti AI',
  tagline: 'INTELLIGENT AI GURU FOR FARMERS',
  logo: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
  primaryColor: '#8BC34A',
  secondaryColor: '#4CAF50',
  accentColor: '#2196F3',
  backgroundColor: '#FFFFFF',
  textColor: '#333333',
  features: ['ai_chat', 'weather', 'market_prices', 'crop_advisory']
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectTenant = (): string => {
    // Try to detect tenant from subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    if (parts.length > 2) {
      return parts[0]; // subdomain
    }
    
    // Fallback to default tenant
    return 'default';
  };

  const loadTenantBranding = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tenantSlug = detectTenant();
      console.log('Loading branding for tenant:', tenantSlug);
      
      // Fetch tenant data
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', tenantSlug)
        .single();

      if (tenantError && tenantError.code !== 'PGRST116') {
        console.error('Error fetching tenant:', tenantError);
        setBranding(defaultBranding);
        return;
      }

      if (!tenant) {
        console.log('No tenant found, using default branding');
        setBranding(defaultBranding);
        return;
      }

      // Fetch tenant branding
      const { data: brandingData, error: brandingError } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      // Fetch tenant features - using correct column names from schema
      const { data: featuresData } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      // Extract enabled features from the tenant_features table
      const features: string[] = [];
      if (featuresData) {
        if (featuresData.ai_chat) features.push('ai_chat');
        if (featuresData.weather_forecast) features.push('weather');
        if (featuresData.marketplace) features.push('market_prices');
        if (featuresData.satellite_imagery) features.push('satellite');
        if (featuresData.community_forum) features.push('community');
      }

      // Build branding object with correct property names
      const tenantBranding: TenantBranding = {
        id: tenant.id,
        name: tenant.name,
        appName: brandingData?.app_name || tenant.name,
        tagline: brandingData?.app_tagline || defaultBranding.tagline,
        logo: brandingData?.logo_url || defaultBranding.logo,
        splashLogo: brandingData?.logo_url || defaultBranding.logo,
        primaryColor: brandingData?.primary_color || defaultBranding.primaryColor,
        secondaryColor: brandingData?.secondary_color || defaultBranding.secondaryColor,
        accentColor: brandingData?.accent_color || defaultBranding.accentColor,
        backgroundColor: brandingData?.background_color || defaultBranding.backgroundColor,
        textColor: brandingData?.text_color || defaultBranding.textColor,
        subdomain: tenant.subdomain,
        customDomain: tenant.custom_domain,
        features: features.length > 0 ? features : defaultBranding.features
      };

      setBranding(tenantBranding);
      
      // Apply CSS variables for dynamic theming
      applyThemeColors(tenantBranding);
      
    } catch (err) {
      console.error('Error loading tenant branding:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branding');
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeColors = (branding: TenantBranding) => {
    const root = document.documentElement;
    
    // Convert hex to HSL and apply to CSS variables
    root.style.setProperty('--primary', hexToHsl(branding.primaryColor));
    root.style.setProperty('--secondary', hexToHsl(branding.secondaryColor));
    root.style.setProperty('--accent', hexToHsl(branding.accentColor));
    root.style.setProperty('--background', hexToHsl(branding.backgroundColor));
    root.style.setProperty('--foreground', hexToHsl(branding.textColor));
  };

  const hexToHsl = (hex: string): string => {
    // Simple hex to HSL conversion for CSS variables
    // This is a basic implementation - you might want to use a more robust library
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    loadTenantBranding();
  }, []);

  const refreshBranding = async () => {
    await loadTenantBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, error, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
