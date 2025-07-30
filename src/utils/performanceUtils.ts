
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetric> = new Map();
  
  start(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }
  
  end(name: string): number | undefined {
    const metric = this.metrics.get(name);
    if (!metric) return undefined;
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.metrics.set(name, {
      ...metric,
      endTime,
      duration,
    });
    
    return duration;
  }
  
  measure<T>(name: string, fn: () => T): T {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
  
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }
  
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }
  
  clear(): void {
    this.metrics.clear();
  }
}

export const profiler = new PerformanceProfiler();

// React hook for component performance tracking
export const usePerformanceProfiler = (componentName: string) => {
  React.useEffect(() => {
    profiler.start(`${componentName}-mount`);
    
    return () => {
      profiler.end(`${componentName}-mount`);
    };
  }, [componentName]);
  
  return {
    measure: (operation: string, fn: () => void) => 
      profiler.measure(`${componentName}-${operation}`, fn),
    measureAsync: <T>(operation: string, fn: () => Promise<T>) => 
      profiler.measureAsync(`${componentName}-${operation}`, fn),
  };
};

// Performance budget checker
export const checkPerformanceBudget = (metric: PerformanceMetric, budgetMs: number): boolean => {
  if (!metric.duration) return false;
  
  if (metric.duration > budgetMs) {
    console.warn(`Performance budget exceeded: ${metric.name} took ${metric.duration}ms (budget: ${budgetMs}ms)`);
    return false;
  }
  
  return true;
};
