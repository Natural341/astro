// Single React Query client — caching/retry/dedup for all server data.
// The cache is persisted to AsyncStorage (see App.tsx) so previously loaded
// data shows instantly on the next launch, then revalidates in the background.
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24h

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // treat data fresh for 30s before refetching
      gcTime: CACHE_MAX_AGE, // keep (and persist) cache for 24h
      retry: 1, // one retry on failure
      refetchOnWindowFocus: false,
    },
  },
});

// Local disk persister — stores the query cache under one AsyncStorage key.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'KOSMOS_QUERY_CACHE',
  throttleTime: 1000,
});
