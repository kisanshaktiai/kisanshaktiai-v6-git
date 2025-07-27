
import { useQuery } from '@tanstack/react-query';
import { optimizedDataService } from '@/services/OptimizedDataService';

export const useOptimizedDashboard = () => {
  return useQuery({
    queryKey: ['optimized-dashboard'],
    queryFn: async () => {
      try {
        const data = await optimizedDataService.getDashboardData();
        console.log('Dashboard query success:', data);
        return data;
      } catch (error) {
        console.error('Dashboard query error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
