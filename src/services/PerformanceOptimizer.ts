import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

interface PerformanceProfile {
  name: 'ultra-low' | 'low' | 'medium' | 'high';
  settings: {
    animationsEnabled: boolean;
    animationDuration: number;
    imageQuality: 'low' | 'medium' | 'high' | 'auto';
    lazyLoadThreshold: number;
    cacheSize: number; // MB
    batchSize: number;
    debounceDelay: number;
    virtualScrollEnabled: boolean;
    prefetchDistance: number;
    maxConcurrentRequests: number;
  };
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private currentProfile: PerformanceProfile;
  private deviceInfo: any;
  private memoryWarnings = 0;
  private performanceMetrics: Map<string, number[]> = new Map();
  
  private readonly profiles: Record<string, PerformanceProfile> = {
    'ultra-low': {
      name: 'ultra-low',
      settings: {
        animationsEnabled: false,
        animationDuration: 0,
        imageQuality: 'low',
        lazyLoadThreshold: 500,
        cacheSize: 10,
        batchSize: 10,
        debounceDelay: 500,
        virtualScrollEnabled: true,
        prefetchDistance: 1,
        maxConcurrentRequests: 1
      }
    },
    'low': {
      name: 'low',
      settings: {
        animationsEnabled: true,
        animationDuration: 200,
        imageQuality: 'low',
        lazyLoadThreshold: 300,
        cacheSize: 25,
        batchSize: 25,
        debounceDelay: 300,
        virtualScrollEnabled: true,
        prefetchDistance: 2,
        maxConcurrentRequests: 2
      }
    },
    'medium': {
      name: 'medium',
      settings: {
        animationsEnabled: true,
        animationDuration: 300,
        imageQuality: 'medium',
        lazyLoadThreshold: 200,
        cacheSize: 50,
        batchSize: 50,
        debounceDelay: 200,
        virtualScrollEnabled: true,
        prefetchDistance: 3,
        maxConcurrentRequests: 3
      }
    },
    'high': {
      name: 'high',
      settings: {
        animationsEnabled: true,
        animationDuration: 400,
        imageQuality: 'high',
        lazyLoadThreshold: 100,
        cacheSize: 100,
        batchSize: 100,
        debounceDelay: 100,
        virtualScrollEnabled: false,
        prefetchDistance: 5,
        maxConcurrentRequests: 5
      }
    }
  };

  private constructor() {
    this.currentProfile = this.profiles.medium;
    this.initialize();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private async initialize() {
    // Get device info
    this.deviceInfo = await Device.getInfo();
    
    // Detect performance profile based on device
    const profile = await this.detectOptimalProfile();
    this.setProfile(profile);
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
    
    // Setup app state listeners
    this.setupAppStateListeners();
    
    // Apply initial optimizations
    this.applyOptimizations();
  }

  private async detectOptimalProfile(): Promise<PerformanceProfile> {
    // Get device capabilities
    const deviceInfo = await Device.getInfo();
    const { value: savedProfile } = await Preferences.get({ key: 'performance_profile' });
    
    if (savedProfile && this.profiles[savedProfile]) {
      return this.profiles[savedProfile];
    }

    // Auto-detect based on device
    if (deviceInfo.platform === 'web') {
      // For web, check browser capabilities
      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency;
      
      if (memory && memory <= 2) {
        return this.profiles['low'];
      } else if (memory && memory >= 8 && cores && cores >= 4) {
        return this.profiles['high'];
      }
      return this.profiles['medium'];
    }

    // For mobile devices
    if (deviceInfo.platform === 'ios') {
      // iOS devices generally have good performance
      return this.profiles['high'];
    } else if (deviceInfo.platform === 'android') {
      // For Android, we need to be more conservative
      // Check Android version and estimate based on that
      const osVersion = parseFloat(deviceInfo.osVersion || '0');
      
      if (osVersion < 8) {
        return this.profiles['ultra-low'];
      } else if (osVersion < 10) {
        return this.profiles['low'];
      } else if (osVersion < 12) {
        return this.profiles['medium'];
      }
      return this.profiles['high'];
    }

    return this.profiles['medium'];
  }

  private setupMemoryMonitoring() {
    if ('memory' in performance && (performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize;
        const totalMemory = memory.jsHeapSizeLimit;
        const memoryUsagePercent = (usedMemory / totalMemory) * 100;

        if (memoryUsagePercent > 80) {
          this.handleMemoryPressure();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private handleMemoryPressure() {
    this.memoryWarnings++;
    
    if (this.memoryWarnings > 3) {
      // Downgrade performance profile
      if (this.currentProfile.name === 'high') {
        this.setProfile(this.profiles['medium']);
      } else if (this.currentProfile.name === 'medium') {
        this.setProfile(this.profiles['low']);
      } else if (this.currentProfile.name === 'low') {
        this.setProfile(this.profiles['ultra-low']);
      }
      
      // Trigger garbage collection hint
      this.triggerCleanup();
      
      // Reset warnings after downgrade
      this.memoryWarnings = 0;
    }
  }

  private setupAppStateListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // App went to background, reduce resource usage
        this.pauseNonCriticalOperations();
      } else {
        // App came to foreground
        this.resumeOperations();
      }
    });

    App.addListener('pause', () => {
      // App paused, cleanup
      this.triggerCleanup();
    });
  }

  private applyOptimizations() {
    const settings = this.currentProfile.settings;
    
    // Apply CSS optimizations
    this.applyCSSOptimizations(settings);
    
    // Configure image loading
    this.configureImageLoading(settings);
    
    // Setup request batching
    this.setupRequestBatching(settings);
    
    // Configure animations
    this.configureAnimations(settings);
  }

  private applyCSSOptimizations(settings: PerformanceProfile['settings']) {
    const root = document.documentElement;
    
    // Set CSS variables for animations
    root.style.setProperty('--animation-duration', `${settings.animationDuration}ms`);
    root.style.setProperty('--animation-enabled', settings.animationsEnabled ? '1' : '0');
    
    // Add performance class to body
    document.body.className = document.body.className
      .replace(/performance-\w+/g, '')
      .concat(` performance-${this.currentProfile.name}`);
    
    // Enable/disable GPU acceleration
    if (settings.animationsEnabled) {
      root.style.setProperty('--use-gpu', 'translateZ(0)');
    } else {
      root.style.setProperty('--use-gpu', 'none');
    }
  }

  private configureImageLoading(settings: PerformanceProfile['settings']) {
    // Configure lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              // Apply quality settings
              const qualitySrc = this.getQualityAdjustedSrc(src, settings.imageQuality);
              img.src = qualitySrc;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: `${settings.lazyLoadThreshold}px`
      }
    );

    images.forEach(img => imageObserver.observe(img));
  }

  private getQualityAdjustedSrc(src: string, quality: string): string {
    // Adjust image source based on quality setting
    if (quality === 'low') {
      return src.replace(/(\.\w+)$/, '_low$1');
    } else if (quality === 'medium') {
      return src.replace(/(\.\w+)$/, '_medium$1');
    }
    return src;
  }

  private setupRequestBatching(settings: PerformanceProfile['settings']) {
    // Store this in a global for request interceptors to use
    (window as any).__performanceBatchSize = settings.batchSize;
    (window as any).__performanceMaxConcurrent = settings.maxConcurrentRequests;
  }

  private configureAnimations(settings: PerformanceProfile['settings']) {
    if (!settings.animationsEnabled) {
      // Disable all animations
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private pauseNonCriticalOperations() {
    // Pause background tasks when app is not active
    console.log('⏸️ Pausing non-critical operations');
    (window as any).__appPaused = true;
  }

  private resumeOperations() {
    console.log('▶️ Resuming operations');
    (window as any).__appPaused = false;
  }

  private triggerCleanup() {
    // Clear caches and trigger garbage collection hint
    if ('caches' in window) {
      this.cleanupOldCaches();
    }
    
    // Clear performance metrics older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.performanceMetrics.forEach((metrics, key) => {
      const recentMetrics = metrics.filter(timestamp => timestamp > oneHourAgo);
      if (recentMetrics.length === 0) {
        this.performanceMetrics.delete(key);
      } else {
        this.performanceMetrics.set(key, recentMetrics);
      }
    });
  }

  private async cleanupOldCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const cacheName of cacheNames) {
        // Parse cache timestamp if embedded in name
        const match = cacheName.match(/cache-(\d+)/);
        if (match) {
          const cacheTime = parseInt(match[1]);
          if (Date.now() - cacheTime > maxAge) {
            await caches.delete(cacheName);
          }
        }
      }
    }
  }

  // Public API
  setProfile(profile: PerformanceProfile) {
    this.currentProfile = profile;
    this.applyOptimizations();
    
    // Save preference
    Preferences.set({
      key: 'performance_profile',
      value: profile.name
    });
    
    console.log(`⚡ Performance profile set to: ${profile.name}`);
  }

  getProfile(): PerformanceProfile {
    return this.currentProfile;
  }

  getSettings() {
    return this.currentProfile.settings;
  }

  measurePerformance(operation: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    this.performanceMetrics.get(operation)!.push(end - start);
  }

  async measureAsyncPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    this.performanceMetrics.get(operation)!.push(end - start);
    
    return result;
  }

  getPerformanceReport(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const report: Record<string, any> = {};
    
    this.performanceMetrics.forEach((metrics, operation) => {
      if (metrics.length > 0) {
        const sum = metrics.reduce((a, b) => a + b, 0);
        report[operation] = {
          avg: sum / metrics.length,
          min: Math.min(...metrics),
          max: Math.max(...metrics),
          count: metrics.length
        };
      }
    });
    
    return report;
  }

  // Utility function for components to check if animations should be used
  shouldAnimate(): boolean {
    return this.currentProfile.settings.animationsEnabled;
  }

  // Get debounce delay for current profile
  getDebounceDelay(): number {
    return this.currentProfile.settings.debounceDelay;
  }

  // Check if virtual scrolling should be used
  shouldUseVirtualScroll(): boolean {
    return this.currentProfile.settings.virtualScrollEnabled;
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();