import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import type { SessionResponse } from '@mingo/shared';
import { ApiError } from './api-client';
import { qk } from './query-keys';
import { useToast } from '../stores/toast-store';

// Só "sessão expirada" (UNAUTHENTICATED) derruba a sessão. Erros de login como
// senha errada (INVALID_CREDENTIALS) ficam no próprio formulário.
function handleUnauthenticated(error: unknown) {
  if (!(error instanceof ApiError) || error.code !== 'UNAUTHENTICATED') return;
  const session = queryClient.getQueryData<SessionResponse>(qk.session);
  if (session?.user) {
    queryClient.setQueryData<SessionResponse>(qk.session, { user: null });
    queryClient.removeQueries({ queryKey: qk.orders.all });
    queryClient.removeQueries({ queryKey: qk.admin.all });
    useToast.getState().show('Sua sessão expirou. Entre novamente.', 'info');
  }
}

const retryOnServerErrors = (failureCount: number, error: unknown) =>
  failureCount < 2 && error instanceof ApiError && (error.status === 0 || error.status >= 500);

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthenticated }),
  mutationCache: new MutationCache({ onError: handleUnauthenticated }),
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: retryOnServerErrors },
    mutations: { retry: false },
  },
});
