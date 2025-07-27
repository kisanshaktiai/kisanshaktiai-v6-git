
import { useQuery } from '@tanstack/react-query';
import { optimizedDataService } from '@/services/OptimizedDataService';

export const useOptimizedProfile = () => {
  return useQuery({
    queryKey: ['optimized-profile'],
    queryFn: () => optimizedDataService.getFarmerProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
