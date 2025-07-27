
interface TenantTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface TenantBranding {
  logoUrl?: string;
  appName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  iconSet?: 'default' | 'custom';
  customIcons?: Record<string, string>;
}

export const createTenantTheme = (branding?: TenantBranding): TenantTheme => {
  const defaultTheme: TenantTheme = {
    primary: '142 51% 36%', // Green for agriculture
    secondary: '142 69% 58%',
    accent: '25 95% 53%', // Orange for CTAs
    background: '0 0% 100%',
    surface: '0 0% 98%',
    text: '222 84% 5%',
    textSecondary: '215 16% 47%',
    success: '142 76% 36%',
    warning: '48 96% 53%',
    error: '0 84% 60%',
    info: '221 83% 53%'
  };

  if (!branding) return defaultTheme;

  return {
    ...defaultTheme,
    primary: branding.primaryColor ? hexToHSL(branding.primaryColor) : defaultTheme.primary,
    secondary: branding.secondaryColor ? hexToHSL(branding.secondaryColor) : defaultTheme.secondary,
    accent: branding.accentColor ? hexToHSL(branding.accentColor) : defaultTheme.accent,
    background: branding.backgroundColor ? hexToHSL(branding.backgroundColor) : defaultTheme.background,
    text: branding.textColor ? hexToHSL(branding.textColor) : defaultTheme.text,
  };
};

const hexToHSL = (hex: string): string => {
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
  
  const hValue = Math.round(h * 360);
  const sValue = Math.round(s * 100);
  const lValue = Math.round(l * 100);
  
  return `${hValue} ${sValue}% ${lValue}%`;
};

export const applyTenantTheme = (theme: TenantTheme) => {
  const root = document.documentElement;
  
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

export const getTenantIcon = (iconName: string, branding?: TenantBranding): string => {
  if (branding?.customIcons?.[iconName]) {
    return branding.customIcons[iconName];
  }
  
  // Default icon mapping
  const defaultIcons: Record<string, string> = {
    home: 'home',
    land: 'map',
    chat: 'message-circle',
    scan: 'scan',
    market: 'shopping-cart',
    weather: 'cloud-sun',
    task: 'check-circle',
    notification: 'bell',
    user: 'user'
  };
  
  return defaultIcons[iconName] || 'help-circle';
};
