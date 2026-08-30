import { useQuery } from '@tanstack/react-query';
import {
  fetchMyDomains,
  fetchMyWebsites,
  type ClientDomain,
  type ClientWebsite,
} from '@/services/client.service';
import { useAuth } from '@/features/auth/auth-context';

/** Clés de cache des ressources visibles par un client. */
export const clientKeys = {
  all: ['client'] as const,
  websites: () => [...clientKeys.all, 'websites'] as const,
  domains: () => [...clientKeys.all, 'domains'] as const,
};

export function useMyWebsites() {
  const { user, isLoading } = useAuth();

  return useQuery<ClientWebsite[]>({
    queryKey: clientKeys.websites(),
    queryFn: fetchMyWebsites,
    enabled: !isLoading && Boolean(user),
    staleTime: 60_000,
  });
}

export function useMyDomains() {
  const { user, isLoading } = useAuth();

  return useQuery<ClientDomain[]>({
    queryKey: clientKeys.domains(),
    queryFn: fetchMyDomains,
    enabled: !isLoading && Boolean(user),
    staleTime: 60_000,
  });
}
