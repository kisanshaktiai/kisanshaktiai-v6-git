
class ThemeCache {
  private static instance: ThemeCache;
  private cache = new Map<string, any>();
  private batchedUpdates: (() => void)[] = [];
  private updateScheduled = false;

  static getInstance(): ThemeCache {
    if (!this.instance) {
      this.instance = new ThemeCache();
    }
    return this.instance;
  }

  getCachedTheme(tenantId: string, branding: any) {
    const cacheKey = `${tenantId}_${JSON.stringify(branding)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const theme = this.calculateTheme(branding);
    this.cache.set(cacheKey, theme);
    return theme;
  }

  private calculateTheme(branding: any) {
    if (!branding) return null;
    
    return {
      primary: branding.primary_color ? this.hexToHSL(branding.primary_color) : '142 51% 36%',
      secondary: branding.secondary_color ? this.hexToHSL(branding.secondary_color) : '142 69% 58%',
      accent: branding.accent_color ? this.hexToHSL(branding.accent_color) : '25 95% 53%',
      background: branding.background_color ? this.hexToHSL(branding.background_color) : '0 0% 100%',
      text: branding.text_color ? this.hexToHSL(branding.text_color) : '222 84% 5%',
    };
  }

  batchStyleUpdate(updateFn: () => void) {
    this.batchedUpdates.push(updateFn);
    
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.batchedUpdates.forEach(fn => fn());
        this.batchedUpdates = [];
        this.updateScheduled = false;
      });
    }
  }

  applyTheme(theme: any) {
    this.batchStyleUpdate(() => {
      const root = document.documentElement;
      Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string);
      });
    });
  }

  private hexToHSL(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number, l: number;
    
    l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  clearCache() {
    this.cache.clear();
  }
}

export default ThemeCache;
