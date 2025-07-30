interface PerformanceBudget {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  pageLoadTime: number;
  apiResponseTime: number;
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

export class PerformanceBudgetManager {
  private static instance: PerformanceBudgetManager;
  private budget: PerformanceBudget;
  private alerts: PerformanceAlert[] = [];
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  private constructor() {
    this.budget = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
      pageLoadTime: 3000,
      apiResponseTime: 1000,
    };
  }

  static getInstance(): PerformanceBudgetManager {
    if (!this.instance) {
      this.instance = new PerformanceBudgetManager();
    }
    return this.instance;
  }

  updateBudget(newBudget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...newBudget };
    console.log('📊 Performance budget updated:', this.budget);
  }

  checkBudgetViolation(metric: string, value: number, context?: any): void {
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
        context,
      });
    }
  }

  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  getRecentAlerts(timeWindow = 5 * 60 * 1000): PerformanceAlert[] {
    const cutoff = Date.now() - timeWindow;
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  private triggerAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only recent alerts
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

  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }
}
