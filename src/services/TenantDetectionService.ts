
// Re-export the optimized tenant detection service
export { OptimizedTenantDetection as TenantDetectionService } from './OptimizedTenantDetection';

// Legacy compatibility - redirect to optimized version
import { OptimizedTenantDetection } from './OptimizedTenantDetection';

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  
  static getInstance(): OptimizedTenantDetection {
    return OptimizedTenantDetection.getInstance();
  }
}
