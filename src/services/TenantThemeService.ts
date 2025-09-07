import { WhiteLabelConfigService } from './WhiteLabelConfigService';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  info: string;
  error: string;
}

interface ThemeBranding {
  appName: string;
  appTagline: string;
  logoUrl: string;
  faviconUrl: string;
}

class TenantThemeService {
  private static instance: TenantThemeService;
  private config: any = null;
  private defaultTheme: ThemeColors = {
    primary: '142 71% 45%', // HSL for green
    secondary: '142 71% 35%',
    accent: '174 62% 47%',
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    card: '0 0% 100%',
    cardForeground: '222 47% 11%',
    destructive: '0 84% 60%',
    destructiveForeground: '210 40% 98%',
    border: '214 32% 91%',
    input: '214 32% 91%',
    ring: '142 71% 45%',
    success: '142 71% 45%',
    warning: '38 92% 50%',
    info: '199 89% 48%',
    error: '0 84% 60%'
  };
  
  private defaultBranding: ThemeBranding = {
    appName: 'Agricultural Platform',
    appTagline: 'Your Digital Farming Companion',
    logoUrl: '/lovable-uploads/b75563a8-f082-47af-90f0-95838d69b700.png',
    faviconUrl: '/favicon.ico'
  };

  static getInstance(): TenantThemeService {
    if (!this.instance) {
      this.instance = new TenantThemeService();
    }
    return this.instance;
  }

  async loadTenantTheme(tenantId: string): Promise<void> {
    const whiteLabelService = WhiteLabelConfigService.getInstance();
    this.config = await whiteLabelService.loadConfig(tenantId);
    
    if (this.config) {
      this.applyTheme();
    }
  }

  getColor(colorName: keyof ThemeColors): string {
    if (this.config) {
      const colorMap: Record<keyof ThemeColors, string> = {
        primary: this.config.primary_color,
        secondary: this.config.secondary_color,
        accent: this.config.accent_color,
        background: this.config.background_color,
        foreground: this.config.text_color,
        muted: this.config.muted_color,
        mutedForeground: this.config.muted_color,
        card: this.config.background_color,
        cardForeground: this.config.text_color,
        destructive: this.config.error_color,
        destructiveForeground: '#ffffff',
        border: this.config.border_color,
        input: this.config.border_color,
        ring: this.config.primary_color,
        success: this.config.success_color,
        warning: this.config.warning_color,
        info: this.config.info_color,
        error: this.config.error_color
      };
      
      const hexColor = colorMap[colorName];
      if (hexColor) {
        return this.hexToHSL(hexColor);
      }
    }
    
    return this.defaultTheme[colorName];
  }

  getBranding(): ThemeBranding {
    if (this.config) {
      return {
        appName: this.config.app_name || this.defaultBranding.appName,
        appTagline: this.config.app_tagline || this.defaultBranding.appTagline,
        logoUrl: this.config.logo_url || this.defaultBranding.logoUrl,
        faviconUrl: this.config.favicon_url || this.defaultBranding.faviconUrl
      };
    }
    
    return this.defaultBranding;
  }

  getColorHex(colorName: keyof ThemeColors): string {
    if (this.config) {
      const colorMap: Record<keyof ThemeColors, string> = {
        primary: this.config.primary_color,
        secondary: this.config.secondary_color,
        accent: this.config.accent_color,
        background: this.config.background_color,
        foreground: this.config.text_color,
        muted: this.config.muted_color,
        mutedForeground: this.config.muted_color,
        card: this.config.background_color,
        cardForeground: this.config.text_color,
        destructive: this.config.error_color,
        destructiveForeground: '#ffffff',
        border: this.config.border_color,
        input: this.config.border_color,
        ring: this.config.primary_color,
        success: this.config.success_color || '#10B981',
        warning: this.config.warning_color || '#F59E0B',
        info: this.config.info_color || '#3B82F6',
        error: this.config.error_color || '#EF4444'
      };
      
      return colorMap[colorName] || this.hslToHex(this.defaultTheme[colorName]);
    }
    
    return this.hslToHex(this.defaultTheme[colorName]);
  }

  private hexToHSL(hex: string): string {
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

  private hslToHex(hsl: string): string {
    const parts = hsl.split(' ');
    const h = parseInt(parts[0]) / 360;
    const s = parseInt(parts[1]) / 100;
    const l = parseInt(parts[2]) / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private applyTheme(): void {
    const root = document.documentElement;
    
    // Apply all theme colors
    Object.keys(this.defaultTheme).forEach((key) => {
      const colorKey = key as keyof ThemeColors;
      const hslValue = this.getColor(colorKey);
      root.style.setProperty(`--${this.kebabCase(key)}`, hslValue);
    });
    
    // Apply branding
    const branding = this.getBranding();
    
    if (branding.faviconUrl) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.faviconUrl;
      }
    }
    
    if (branding.appName) {
      document.title = branding.appName;
    }
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  isInitialized(): boolean {
    return this.config !== null;
  }
}

export const tenantTheme = TenantThemeService.getInstance();