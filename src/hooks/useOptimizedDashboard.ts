
import { useQuery } from '@tanstack/react-query';
import { optimizedDataService } from '@/services/OptimizedDataService';

export const useOptimizedDashboard = () => {
  return useQuery({
    queryKey: ['optimized-dashboard'],
    queryFn: () => optimizedDataService.getDashboardData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    retry: 2,
  });
};
