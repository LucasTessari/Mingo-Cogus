import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, PublicUser, RegisterInput, SessionResponse } from '@mingo/shared';
import { api } from '../lib/api';
import { qk } from '../lib/query-keys';

export function useSession() {
  const query = useQuery({ queryKey: qk.session, queryFn: api.session, staleTime: Infinity });
  const user = query.data?.user ?? null;
  return { user, isLoading: query.isLoading, isAdmin: user?.role === 'ADMIN' };
}

function useStartSession() {
  const queryClient = useQueryClient();
  return (user: PublicUser) => {
    queryClient.setQueryData<SessionResponse>(qk.session, { user });
    queryClient.removeQueries({ queryKey: qk.orders.all });
  };
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: ({ user }) => startSession(user),
  });
}

export function useRegister() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
    onSuccess: ({ user }) => startSession(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      queryClient.setQueryData<SessionResponse>(qk.session, { user: null });
      queryClient.removeQueries({ queryKey: qk.orders.all });
      queryClient.removeQueries({ queryKey: qk.admin.all });
    },
  });
}
