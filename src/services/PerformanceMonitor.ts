import { CoreWebVitalsMonitor } from './performance/CoreWebVitalsMonitor';
import { CustomMetricsTracker } from './performance/CustomMetricsTracker';
import { PerformanceBudgetManager } from './performance/PerformanceBudgetManager';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private coreVitalsMonitor: CoreWebVitalsMonitor;
  private customMetricsTracker: CustomMetricsTracker;
  private budgetManager: PerformanceBudgetManager;
  private isInitialized = false;

  private constructor() {
    this.coreVitalsMonitor = CoreWebVitalsMonitor.getInstance();
    this.customMetricsTracker = CustomMetricsTracker.getInstance();
    this.budgetManager = PerformanceBudgetManager.getInstance();
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  initialize(tenantId?: string, userId?: string): void {
    if (this.isInitialized) return;

    console.log('🚀 Initializing performance monitoring');

    try {
      this.coreVitalsMonitor.initialize();
      
      // Set up budget checking for custom metrics
      this.customMetricsTracker.onMetric = (metric) => {
        this.budgetManager.checkBudgetViolation(metric.name, metric.value, metric.context);
      };

      this.isInitialized = true;
      console.log('✅ Performance monitoring initialized');
    } catch (error) {
      console.error('❌ Performance monitoring initialization failed:', error);
    }
  }

  recordMetric(name: string, value: number, context?: any): void {
    this.customMetricsTracker.recordMetric(name, value, context);
  }

  startTiming(operation: string): () => number {
    return this.customMetricsTracker.startTiming(operation);
  }

  monitorAPICall<T>(apiCall: Promise<T>, endpoint: string, context?: any): Promise<T> {
    return this.customMetricsTracker.monitorAPICall(apiCall, endpoint, context);
  }

  updateBudget(newBudget: any): void {
    this.budgetManager.updateBudget(newBudget);
  }

  onAlert(callback: (alert: any) => void): () => void {
    return this.budgetManager.onAlert(callback);
  }

  getPerformanceSummary() {
    const coreVitals = this.coreVitalsMonitor.getMetrics();
    const alerts = this.budgetManager.getRecentAlerts();
    
    return {
      coreVitals,
      alerts,
      customMetrics: {
        // Add summary of custom metrics
      }
    };
  }

  cleanup(): void {
    this.coreVitalsMonitor.cleanup();
    this.customMetricsTracker.cleanup();
    this.isInitialized = false;
  }
}
