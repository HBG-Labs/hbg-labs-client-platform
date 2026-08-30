import { useQuery } from '@tanstack/react-query';
import {
  fetchAuditActions,
  fetchAuditLog,
  type AuditLogEntry,
  type AuditLogFilters,
} from '@/services/audit.service';

/** Clés de cache du journal d'audit. */
export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditLogFilters) => [...auditKeys.all, 'list', filters] as const,
  actions: () => [...auditKeys.all, 'actions'] as const,
};

/**
 * Entrées du journal.
 *
 * `staleTime` est court : une consultation du journal sert souvent à vérifier
 * qu'une action vient d'être enregistrée. Un cache long donnerait à croire que
 * la trace manque.
 */
export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery<AuditLogEntry[]>({
    queryKey: auditKeys.list(filters),
    queryFn: () => fetchAuditLog(filters),
    staleTime: 10_000,
  });
}

export function useAuditActions() {
  return useQuery<string[]>({
    queryKey: auditKeys.actions(),
    queryFn: fetchAuditActions,
    staleTime: 60_000,
  });
}
