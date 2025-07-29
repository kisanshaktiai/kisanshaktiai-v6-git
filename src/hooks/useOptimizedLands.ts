
import { useQuery } from '@tanstack/react-query';
import { optimizedDataService } from '@/services/OptimizedDataService';

export const useOptimizedLands = (landId?: string) => {
  return useQuery({
    queryKey: ['optimized-lands', landId],
    queryFn: () => optimizedDataService.getLandsSummary(landId),
    staleTime: 5 * 60 * 1000, // 5 minutes - land data can change with updates
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 60 * 1000, // Background refresh every 15 minutes
    enabled: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
};
