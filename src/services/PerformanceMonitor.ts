interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  resourceLoadTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
  interactionTime?: number;
  
  // User experience metrics
  networkType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  
  // App-specific metrics
  chatResponseTime?: number;
  weatherDataLoadTime?: number;
  translationLoadTime?: number;
  imageLoadTime?: number;
  
  timestamp: number;
  url: string;
  userAgent: string;
  tenantId?: string;
  userId?: string;
}

interface PerformanceBudget {
  lcp: number; // 2500ms
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1800ms
  ttfb: number; // 800ms
  pageLoadTime: number; // 3000ms
  apiResponseTime: number; // 1000ms
}

interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  timestamp: number;
  url: string;
  context?: any;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private budget: PerformanceBudget;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];
  private isInitialized = false;
  
  private constructor() {
    this.budget = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
      pageLoadTime: 3000,
      apiResponseTime: 1000
    };
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(tenantId?: string, userId?: string): void {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing performance monitoring');
    
    try {
      this.setupCoreWebVitalsObservers();
      this.setupNavigationObserver();
      this.setupResourceObserver();
      this.setupLongTaskObserver();
      this.monitorNetworkInformation();
      this.monitorMemoryUsage();
      
      // Set context for all metrics
      this.tenantId = tenantId;
      this.userId = userId;
      
      this.isInitialized = true;
      console.log('✅ Performance monitoring initialized');
    } catch (error) {
      console.error('❌ Performance monitoring initialization failed:', error);
    }
  }

  /**
   * Record custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    context?: any,
    tenantId?: string,
    userId?: string
  ): void {
    const metric: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      tenantId: tenantId || this.tenantId,
      userId: userId || this.userId
    };

    // Map custom metrics
    switch (name) {
      case 'chatResponseTime':
        metric.chatResponseTime = value;
        break;
      case 'weatherDataLoadTime':
        metric.weatherDataLoadTime = value;
        break;
      case 'translationLoadTime':
        metric.translationLoadTime = value;
        break;
      case 'imageLoadTime':
        metric.imageLoadTime = value;
        break;
      case 'apiResponseTime':
        metric.apiResponseTime = value;
        break;
      default:
        console.warn(`Unknown metric: ${name}`);
        return;
    }

    this.addMetric(metric as PerformanceMetrics);
    this.checkBudgetViolation(name, value, context);
  }

  /**
   * Start timing for an operation
   */
  startTiming(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  /**
   * Monitor API call performance
   */
  monitorAPICall<T>(
    apiCall: Promise<T>,
    endpoint: string,
    context?: any
  ): Promise<T> {
    const startTime = performance.now();
    
    return apiCall
      .then((result) => {
        const duration = performance.now() - startTime;
        this.recordMetric('apiResponseTime', duration, { endpoint, ...context });
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        this.recordMetric('apiResponseTime', duration, { 
          endpoint, 
          error: error.message, 
          ...context 
        });
        throw error;
      });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindow?: number): {
    coreWebVitals: { [key: string]: { avg: number; p95: number; violations: number } };
    customMetrics: { [key: string]: { avg: number; p95: number; violations: number } };
    alerts: PerformanceAlert[];
  } {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const coreWebVitals = this.calculateMetricStats(recentMetrics, [
      'lcp', 'fid', 'cls', 'fcp', 'ttfb'
    ]);
    
    const customMetrics = this.calculateMetricStats(recentMetrics, [
      'chatResponseTime', 'weatherDataLoadTime', 'translationLoadTime', 
      'imageLoadTime', 'apiResponseTime', 'pageLoadTime'
    ]);
    
    const recentAlerts = this.getRecentAlerts(timeWindow);
    
    return {
      coreWebVitals,
      customMetrics,
      alerts: recentAlerts
    };
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update performance budget
   */
  updateBudget(newBudget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...newBudget };
    console.log('📊 Performance budget updated:', this.budget);
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.metricsToCSV();
    }
    
    return JSON.stringify({
      metrics: this.metrics,
      budget: this.budget,
      summary: this.getPerformanceSummary()
    }, null, 2);
  }

  // Private methods
  private tenantId?: string;
  private userId?: string;
  private alerts: PerformanceAlert[] = [];

  private setupCoreWebVitalsObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          this.addMetric({
            lcp: lastEntry.startTime,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            tenantId: this.tenantId,
            userId: this.userId
          });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.addMetric({
              fid: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              tenantId: this.tenantId,
              userId: this.userId
            });
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          this.addMetric({
            cls: clsValue,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            tenantId: this.tenantId,
            userId: this.userId
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private setupNavigationObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.addMetric({
              fcp: entry.firstContentfulPaint,
              ttfb: entry.responseStart - entry.requestStart,
              pageLoadTime: entry.loadEventEnd - entry.fetchStart,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              tenantId: this.tenantId,
              userId: this.userId
            });
          });
        });
        
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }
    }
  }

  private setupResourceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.initiatorType === 'img') {
              this.recordMetric('imageLoadTime', entry.duration, {
                resource: entry.name,
                size: entry.transferSize
              });
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }

  private setupLongTaskObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.triggerAlert({
              metric: 'longTask',
              value: entry.duration,
              threshold: 50, // 50ms threshold for long tasks
              severity: entry.duration > 100 ? 'error' : 'warning',
              timestamp: Date.now(),
              url: window.location.href,
              context: { startTime: entry.startTime }
            });
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  private monitorNetworkInformation(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.addMetric({
        networkType: connection.effectiveType,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        tenantId: this.tenantId,
        userId: this.userId
      });
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      this.addMetric({
        deviceMemory: memory.usedJSHeapSize / 1024 / 1024, // MB
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        tenantId: this.tenantId,
        userId: this.userId
      });
    }
    
    if ('hardwareConcurrency' in navigator) {
      this.addMetric({
        hardwareConcurrency: navigator.hardwareConcurrency,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        tenantId: this.tenantId,
        userId: this.userId
      });
    }
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics (last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private checkBudgetViolation(metric: string, value: number, context?: any): void {
    const threshold = (this.budget as any)[metric];
    
    if (threshold && value > threshold) {
      const severity: 'warning' | 'error' | 'critical' = 
        value > threshold * 2 ? 'critical' :
        value > threshold * 1.5 ? 'error' : 'warning';
      
      this.triggerAlert({
        metric,
        value,
        threshold,
        severity,
        timestamp: Date.now(),
        url: window.location.href,
        context
      });
    }
  }

  private triggerAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Notify subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Performance alert callback failed:', error);
      }
    });
    
    console.warn(`⚠️ Performance alert: ${alert.metric} = ${alert.value}ms (threshold: ${alert.threshold}ms)`);
  }

  private calculateMetricStats(
    metrics: PerformanceMetrics[],
    metricNames: string[]
  ): { [key: string]: { avg: number; p95: number; violations: number } } {
    const stats: { [key: string]: { avg: number; p95: number; violations: number } } = {};
    
    metricNames.forEach(metricName => {
      const values = metrics
        .map(m => (m as any)[metricName])
        .filter(v => v !== undefined && v !== null)
        .sort((a, b) => a - b);
      
      if (values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const p95Index = Math.floor(values.length * 0.95);
        const p95 = values[p95Index] || values[values.length - 1];
        
        const threshold = (this.budget as any)[metricName];
        const violations = threshold ? values.filter(v => v > threshold).length : 0;
        
        stats[metricName] = { avg, p95, violations };
      }
    });
    
    return stats;
  }

  private getRecentAlerts(timeWindow?: number): PerformanceAlert[] {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  private metricsToCSV(): string {
    if (this.metrics.length === 0) return '';
    
    const headers = Object.keys(this.metrics[0]);
    const csvRows = [headers.join(',')];
    
    this.metrics.forEach(metric => {
      const row = headers.map(header => {
        const value = (metric as any)[header];
        return typeof value === 'string' ? `\"${value}\"` : value || '';
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Cleanup observers and data
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.alerts = [];
    this.alertCallbacks = [];
    this.isInitialized = false;
  }
}
