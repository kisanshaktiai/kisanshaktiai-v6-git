
import { useQuery } from '@tanstack/react-query';
import { optimizedDataService } from '@/services/OptimizedDataService';

export const useOptimizedLands = (landId?: string) => {
  return useQuery({
    queryKey: ['optimized-lands', landId],
    queryFn: () => optimizedDataService.getLandsSummary(landId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: true,
    retry: 2,
  });
};
