import { supabase } from '@/integrations/supabase/client';

interface WhiteLabelConfig {
  id: string;
  tenant_id: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  muted_color?: string;
  success_color?: string;
  error_color?: string;
  warning_color?: string;
  info_color?: string;
  font_family?: string;
  font_size_base?: string;
  border_radius?: string;
  button_style?: string;
  input_style?: string;
  header_bg_color?: string;
  header_text_color?: string;
  sidebar_bg_color?: string;
  sidebar_text_color?: string;
  footer_bg_color?: string;
  footer_text_color?: string;
  logo_url?: string;
  favicon_url?: string;
  app_name?: string;
  app_tagline?: string;
  splash_screen_config?: any;
  auth_screen_config?: any;
  onboarding_config?: any;
  custom_css?: string;
  theme_mode?: string;
  animation_enabled?: boolean;
}

interface CachedConfig {
  config: WhiteLabelConfig | null;
  timestamp: number;
  tenantId: string;
}

export class WhiteLabelConfigService {
  private static instance: WhiteLabelConfigService;
  private cache: CachedConfig | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): WhiteLabelConfigService {
    if (!this.instance) {
      this.instance = new WhiteLabelConfigService();
    }
    return this.instance;
  }

  async loadConfig(tenantId: string): Promise<WhiteLabelConfig | null> {
    // Check cache
    if (this.cache && 
        this.cache.tenantId === tenantId && 
        Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.config;
    }

    try {
      // Use a simpler query approach to avoid type issues
      const response = await supabase
        .from('white_label_configs')
        .select('*')
        .match({ 
          tenant_id: tenantId,
          is_active: true 
        })
        .limit(1);

      if (response.error) {
        console.warn('Failed to load white label config:', response.error);
        // Try to fall back to tenant_branding table
        return this.loadFallbackBranding(tenantId);
      }

      const data = response.data?.[0] || null;

      if (data) {
        // Cache the result
        this.cache = {
          config: data as WhiteLabelConfig,
          timestamp: Date.now(),
          tenantId
        };
        return data as WhiteLabelConfig;
      }

      return this.loadFallbackBranding(tenantId);
    } catch (error) {
      console.error('Error loading white label config:', error);
      return this.loadFallbackBranding(tenantId);
    }
  }

  private async loadFallbackBranding(tenantId: string): Promise<WhiteLabelConfig | null> {
    try {
      const { data, error } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) return null;

      // Convert tenant_branding to WhiteLabelConfig format
      return {
        id: data.id,
        tenant_id: data.tenant_id,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        background_color: data.background_color,
        text_color: data.text_color,
        font_family: data.font_family,
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        app_name: data.app_name,
        app_tagline: data.app_tagline,
        custom_css: data.custom_css
      };
    } catch (error) {
      console.error('Error loading fallback branding:', error);
      return null;
    }
  }

  applyConfig(config: WhiteLabelConfig): void {
    const root = document.documentElement;
    
    // Apply color scheme
    const colors = {
      '--primary': config.primary_color,
      '--secondary': config.secondary_color,
      '--accent': config.accent_color,
      '--background': config.background_color,
      '--foreground': config.text_color,
      '--border': config.border_color,
      '--muted': config.muted_color,
      '--muted-foreground': config.muted_color ? this.adjustColorOpacity(config.muted_color, 0.8) : null,
      '--destructive': config.error_color,
      '--success': config.success_color,
      '--warning': config.warning_color,
      '--info': config.info_color,
      '--card': config.background_color,
      '--card-foreground': config.text_color,
      '--popover': config.background_color,
      '--popover-foreground': config.text_color,
    };

    // Convert hex to HSL for better theming
    Object.entries(colors).forEach(([key, value]) => {
      if (value) {
        const hsl = this.hexToHSL(value);
        if (hsl) {
          root.style.setProperty(key, hsl);
        }
      }
    });

    // Apply typography
    if (config.font_family) {
      root.style.setProperty('--font-family', config.font_family);
      document.body.style.fontFamily = config.font_family;
    }

    if (config.font_size_base) {
      root.style.setProperty('--font-size-base', config.font_size_base);
    }

    if (config.border_radius) {
      root.style.setProperty('--radius', config.border_radius);
    }

    // Apply component-specific colors
    if (config.header_bg_color) {
      root.style.setProperty('--header-bg', config.header_bg_color);
    }
    if (config.header_text_color) {
      root.style.setProperty('--header-text', config.header_text_color);
    }
    if (config.sidebar_bg_color) {
      root.style.setProperty('--sidebar-bg', config.sidebar_bg_color);
    }
    if (config.sidebar_text_color) {
      root.style.setProperty('--sidebar-text', config.sidebar_text_color);
    }
    if (config.footer_bg_color) {
      root.style.setProperty('--footer-bg', config.footer_bg_color);
    }
    if (config.footer_text_color) {
      root.style.setProperty('--footer-text', config.footer_text_color);
    }

    // Apply favicon
    if (config.favicon_url) {
      this.updateFavicon(config.favicon_url);
    }

    // Apply app name to title
    if (config.app_name) {
      document.title = config.app_name;
    }

    // Apply custom CSS
    if (config.custom_css) {
      this.applyCustomCSS(config.custom_css);
    }

    // Store config in localStorage for offline access
    localStorage.setItem('white_label_config', JSON.stringify(config));
  }

  private hexToHSL(hex: string): string | null {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      const hsl = this.hexToHSL(color);
      if (hsl) {
        const [h, s, l] = hsl.split(' ');
        return `${h} ${s} ${l} / ${opacity}`;
      }
    }
    return color;
  }

  private updateFavicon(url: string): void {
    const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (existingFavicon) {
      existingFavicon.href = url;
    } else {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = url;
      document.head.appendChild(favicon);
    }
  }

  private applyCustomCSS(css: string): void {
    // Remove existing custom CSS if any
    const existingStyle = document.getElementById('white-label-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new custom CSS
    const styleElement = document.createElement('style');
    styleElement.id = 'white-label-custom-css';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  getConfig(): WhiteLabelConfig | null {
    // Try to get from cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.config;
    }

    // Try localStorage as fallback
    const stored = localStorage.getItem('white_label_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }

    return null;
  }

  clearCache(): void {
    this.cache = null;
    localStorage.removeItem('white_label_config');
  }
}