
import { useQuery } from '@tanstack/react-query';
import { optimizedDataService } from '@/services/OptimizedDataService';

export const useOptimizedProfile = () => {
  return useQuery({
    queryKey: ['optimized-profile'],
    queryFn: () => optimizedDataService.getFarmerProfile(),
    staleTime: 15 * 60 * 1000, // 15 minutes - profile data doesn't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 60 * 1000, // Background refresh every 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
