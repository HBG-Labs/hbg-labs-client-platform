import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addOrganizationMember,
  createDomain,
  createOrganization,
  createWebsite,
  fetchAdminMetrics,
  fetchContactMessages,
  fetchDomains,
  fetchOrganization,
  fetchOrganizationMembers,
  fetchOrganizations,
  fetchQuoteRequests,
  fetchTickets,
  fetchWebsites,
  removeMember,
  updateContactMessageStatus,
  updateQuoteRequestStatus,
  updateMemberRole,
  updateOrganization,
  updateWebsite,
  type DomainInput,
  type OrganizationInput,
  type WebsiteInput,
} from '@/services/admin.service';
import type { LeadStatus, OrgRole, OrganizationStatus } from '@/types/domain';
import { adminKeys } from './admin.keys';

/**
 * Lectures et écritures de l'espace d'administration.
 *
 * Chaque mutation invalide précisément ce qu'elle a modifié, plus les
 * compteurs du tableau de bord quand ils en dépendent. Invalider
 * `adminKeys.all` à chaque écriture relancerait toutes les requêtes de
 * l'écran, y compris celles qui n'ont pas bougé.
 */

// ---- Lectures ---------------------------------------------------------------

export function useAdminMetrics() {
  return useQuery({
    queryKey: adminKeys.metrics(),
    queryFn: fetchAdminMetrics,
    staleTime: 60_000,
  });
}

export function useOrganizations() {
  return useQuery({ queryKey: adminKeys.organizations(), queryFn: fetchOrganizations });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: adminKeys.organization(id),
    queryFn: () => fetchOrganization(id),
    enabled: Boolean(id),
  });
}

export function useOrganizationMembers(id: string) {
  return useQuery({
    queryKey: adminKeys.organizationMembers(id),
    queryFn: () => fetchOrganizationMembers(id),
    enabled: Boolean(id),
  });
}

export function useWebsites() {
  return useQuery({ queryKey: adminKeys.websites(), queryFn: fetchWebsites });
}

export function useDomains() {
  return useQuery({ queryKey: adminKeys.domains(), queryFn: fetchDomains });
}

export function useTickets() {
  return useQuery({ queryKey: adminKeys.tickets(), queryFn: fetchTickets });
}

export function useQuoteRequests() {
  return useQuery({ queryKey: adminKeys.quoteRequests(), queryFn: fetchQuoteRequests });
}

export function useContactMessages() {
  return useQuery({
    queryKey: adminKeys.contactMessages(),
    queryFn: fetchContactMessages,
  });
}

// ---- Écritures --------------------------------------------------------------

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OrganizationInput) => createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.organizations() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  // Le formulaire soumet l'objet complet : un champ vide doit effacer la
  // valeur en base, pas la laisser inchangee. La signature exige donc
  // l'organisation entiere, jamais un Partial.
  return useMutation({
    mutationFn: ({
      input,
      status,
    }: {
      input: OrganizationInput;
      status?: OrganizationStatus;
    }) => updateOrganization(id, input, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.organization(id) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.organizations() });
    },
  });
}

export function useAddOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: OrgRole }) =>
      addOrganizationMember(organizationId, email, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.organizationMembers(organizationId),
      });
    },
  });
}

export function useUpdateMemberRole(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.organizationMembers(organizationId),
      });
    },
  });
}

export function useRemoveMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.organizationMembers(organizationId),
      });
    },
  });
}

export function useCreateWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WebsiteInput) => createWebsite(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.websites() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useUpdateWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WebsiteInput }) =>
      updateWebsite(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.websites() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DomainInput) => createDomain(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.domains() });
    },
  });
}

export function useUpdateQuoteRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateQuoteRequestStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.quoteRequests() });
      // Le compteur des demandes nouvelles depend de ce statut.
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useUpdateContactMessageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateContactMessageStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.contactMessages() });
    },
  });
}
