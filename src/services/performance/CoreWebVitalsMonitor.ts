interface CoreWebVitalsMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  timestamp: number;
  url: string;
}

export class CoreWebVitalsMonitor {
  private static instance: CoreWebVitalsMonitor;
  private metrics: CoreWebVitalsMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private callbacks: Array<(metric: CoreWebVitalsMetrics) => void> = [];

  static getInstance(): CoreWebVitalsMonitor {
    if (!this.instance) {
      this.instance = new CoreWebVitalsMonitor();
    }
    return this.instance;
  }

  initialize(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    this.setupLCPObserver();
    this.setupFIDObserver();
    this.setupCLSObserver();
    this.setupNavigationObserver();
  }

  onMetric(callback: (metric: CoreWebVitalsMetrics) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getMetrics(): CoreWebVitalsMetrics[] {
    return [...this.metrics];
  }

  private addMetric(metric: Partial<CoreWebVitalsMetrics>): void {
    const fullMetric: CoreWebVitalsMetrics = {
      timestamp: Date.now(),
      url: window.location.href,
      ...metric,
    };

    this.metrics.push(fullMetric);
    this.callbacks.forEach(callback => callback(fullMetric));

    // Keep only recent metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private setupLCPObserver(): void {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.addMetric({ lcp: lastEntry.startTime });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }
  }

  private setupFIDObserver(): void {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric({ fid: entry.processingStart - entry.startTime });
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }
  }

  private setupCLSObserver(): void {
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.addMetric({ cls: clsValue });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }
  }

  private setupNavigationObserver(): void {
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric({
            fcp: entry.firstContentfulPaint,
            ttfb: entry.responseStart - entry.requestStart,
          });
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.callbacks = [];
  }
}
