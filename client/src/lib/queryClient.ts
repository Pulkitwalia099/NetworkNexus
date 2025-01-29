import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          try {
            const errorData = await res.json();
            throw new Error(errorData.message || `${res.status}: ${await res.text()}`);
          } catch {
            throw new Error(`${res.status}: ${await res.text()}`);
          }
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Only retry server errors, not client errors
        if (error instanceof Error && error.message.startsWith('5')) {
          return failureCount < 3;
        }
        return false;
      },
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  },
});