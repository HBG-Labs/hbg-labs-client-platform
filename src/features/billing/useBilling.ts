import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchAllSubscriptions,
  fetchMyInvoices,
  fetchMyPayments,
  fetchMySubscriptions,
  openBillingPortal,
  startCheckout,
  type ClientInvoice,
  type ClientPayment,
  type ClientSubscription,
} from '@/services/billing.service';
import { useAuth } from '@/features/auth/auth-context';
import { billingKeys } from './billing.keys';

/**
 * Abonnement, factures et paiements de l'utilisateur connecté.
 *
 * Les requêtes ne partent qu'une fois la session résolue : les lancer plus tôt
 * produirait des appels garantis sans résultat, la RLS n'ayant aucune identité
 * sur laquelle statuer.
 */

/**
 * @param refetchIntervalMs relance périodique, le temps qu'un webhook arrive.
 *   Après un retour de Checkout, l'abonnement n'existe pas encore : Stripe
 *   notifie de façon asynchrone, et l'écran doit se mettre à jour tout seul
 *   plutôt que de demander au client de recharger la page.
 */
export function useMySubscriptions(refetchIntervalMs?: number) {
  const { user, isLoading } = useAuth();

  return useQuery<ClientSubscription[]>({
    queryKey: billingKeys.subscriptions(),
    queryFn: fetchMySubscriptions,
    enabled: !isLoading && Boolean(user),
    staleTime: 30_000,
    refetchInterval: refetchIntervalMs ?? false,
  });
}

export function useMyInvoices() {
  const { user, isLoading } = useAuth();

  return useQuery<ClientInvoice[]>({
    queryKey: billingKeys.invoices(),
    queryFn: fetchMyInvoices,
    enabled: !isLoading && Boolean(user),
    staleTime: 60_000,
  });
}

export function useMyPayments() {
  const { user, isLoading } = useAuth();

  return useQuery<ClientPayment[]>({
    queryKey: billingKeys.payments(),
    queryFn: fetchMyPayments,
    enabled: !isLoading && Boolean(user),
    staleTime: 60_000,
  });
}

/** Tous les abonnements de la plateforme (§30). Filtré par la RLS, pas ici. */
export function useAllSubscriptions() {
  const { user, isLoading } = useAuth();

  return useQuery<ClientSubscription[]>({
    queryKey: billingKeys.allSubscriptions(),
    queryFn: fetchAllSubscriptions,
    enabled: !isLoading && Boolean(user),
    staleTime: 60_000,
  });
}

/**
 * Souscription : ouvre la page de paiement Stripe.
 *
 * Aucun cache n'est invalidé au succès, et c'est délibéré. Rien n'a changé :
 * une session de paiement a été créée, pas un abonnement. L'état ne bougera
 * qu'au retour du webhook. Invalider ici laisserait croire à l'interface qu'il
 * y a quelque chose de nouveau à lire.
 */
export function useStartCheckout() {
  return useMutation({
    mutationFn: (input: { organizationId: string; planPriceId: string }) =>
      startCheckout(input),
    onSuccess: (url) => {
      // Redirection en pleine page, jamais dans une iframe : Stripe l'interdit,
      // et le client doit voir le domaine stripe.com dans sa barre d'adresse
      // pour vérifier à qui il confie sa carte.
      window.location.assign(url);
    },
  });
}

/** Portail de facturation Stripe : changement de carte, résiliation, factures. */
export function useBillingPortal() {
  return useMutation({
    mutationFn: (organizationId: string) => openBillingPortal(organizationId),
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });
}
