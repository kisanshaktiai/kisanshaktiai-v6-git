import { useEffect } from 'react';
import { EnhancedWeatherCache } from '@/services/EnhancedWeatherCache';
import { EnhancedTranslationService } from '@/services/EnhancedTranslationService';
import { AdvancedAssetOptimizer } from '@/services/AdvancedAssetOptimizer';
import { PerformanceMonitor } from '@/services/PerformanceMonitor';

export const useAdvancedOptimizations = (tenantId?: string, userId?: string) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize performance monitoring
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.initialize(tenantId, userId);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Initialize enhanced services
    const weatherCache = EnhancedWeatherCache.getInstance();
    const translationService = EnhancedTranslationService.getInstance();
    const assetOptimizer = AdvancedAssetOptimizer.getInstance();

    // Cleanup on unmount
    return () => {
      performanceMonitor.cleanup();
      assetOptimizer.cleanup();
    };
  }, [tenantId, userId]);

  return {
    weatherCache: EnhancedWeatherCache.getInstance(),
    translationService: EnhancedTranslationService.getInstance(),
    assetOptimizer: AdvancedAssetOptimizer.getInstance(),
    performanceMonitor: PerformanceMonitor.getInstance(),
  };
};