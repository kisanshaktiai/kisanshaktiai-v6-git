interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: any;
}

export class CustomMetricsTracker {
  private static instance: CustomMetricsTracker;
  private metrics: CustomMetric[] = [];
  private timings: Map<string, number> = new Map();

  static getInstance(): CustomMetricsTracker {
    if (!this.instance) {
      this.instance = new CustomMetricsTracker();
    }
    return this.instance;
  }

  recordMetric(name: string, value: number, context?: any): void {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);
    console.log(`📊 Custom metric: ${name} = ${value}ms`, context);

    // Keep only recent metrics
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  startTiming(operation: string): () => number {
    const startTime = performance.now();
    this.timings.set(operation, startTime);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(operation, duration);
      this.timings.delete(operation);
      return duration;
    };
  }

  monitorAPICall<T>(apiCall: Promise<T>, endpoint: string, context?: any): Promise<T> {
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
          ...context,
        });
        throw error;
      });
  }

  getMetricsByName(name: string): CustomMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  getMetricStats(name: string): { avg: number; p95: number; count: number } {
    const values = this.getMetricsByName(name).map(m => m.value).sort((a, b) => a - b);
    
    if (values.length === 0) {
      return { avg: 0, p95: 0, count: 0 };
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const p95Index = Math.floor(values.length * 0.95);
    const p95 = values[p95Index] || values[values.length - 1];

    return { avg, p95, count: values.length };
  }

  cleanup(): void {
    this.metrics = [];
    this.timings.clear();
  }
}
