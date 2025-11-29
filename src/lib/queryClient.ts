import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - optimized for fast-changing data
      gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache longer
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Prevent unnecessary refetches on component mount
    },
  },
});