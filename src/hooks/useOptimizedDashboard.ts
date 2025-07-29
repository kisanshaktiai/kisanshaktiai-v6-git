
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
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard should be relatively fresh
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
