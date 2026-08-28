import { supabase } from '@/lib/supabase';
import type { BillingInterval, PriceKind } from '@/types/domain';

/**
 * Accès aux données du catalogue d'offres (§7).
 *
 * Couche de service : elle isole les requêtes Supabase des composants React.
 * Un composant qui compose lui-même ses requêtes devient impossible à tester
 * sans navigateur, et le jour où une colonne change, la modification se
 * disperse dans l'arborescence au lieu de tenir dans un fichier.
 *
 *
 * LES PRIX VIENNENT DE LA BASE, JAMAIS DU CODE
 *
 * §7 : « Les prix doivent être stockés dans la base de données et non codés en
 * dur partout dans le frontend. » Aucun montant ne doit apparaître en dur dans
 * un composant : une grille tarifaire figée dans le JavaScript continuerait
 * d'annoncer l'ancien tarif longtemps après un changement, et le Checkout
 * facturerait autre chose que ce que le client a lu.
 *
 * Les montants sont en CENTIMES, entiers. Utilisez `formatAmount` pour les
 * afficher.
 */

export interface PlanPrice {
  id: string;
  kind: PriceKind;
  recurring_interval: BillingInterval | null;
  unit_amount_cents: number;
  currency: string;
  /** « à partir de » — la mention DOIT être affichée si vrai (§7). */
  is_starting_price: boolean;
  /** NULL tant que le catalogue Stripe n'existe pas : Checkout indisponible. */
  stripe_price_id: string | null;
}

export interface PlanFeature {
  id: string;
  label: string;
  is_included: boolean;
  detail: string | null;
  sort_order: number;
}

export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  description: string | null;
  requires_quote: boolean;
  is_featured: boolean;
  sort_order: number;
  stripe_product_id: string | null;
  plan_prices: PlanPrice[];
  plan_features: PlanFeature[];
}

/**
 * Charge les offres publiques, leurs prix actifs et leurs caractéristiques.
 *
 * Aucun filtre `is_public` n'est appliqué ici : les policies RLS s'en
 * chargent (migration 04). Le dupliquer côté client donnerait l'impression que
 * la confidentialité dépend de cette requête, alors qu'elle repose sur la
 * base. Un plan retiré du catalogue est invisible même si on le demande
 * nommément.
 */
export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(
      `
      id, code, name, tagline, description,
      requires_quote, is_featured, sort_order, stripe_product_id,
      plan_prices ( id, kind, recurring_interval, unit_amount_cents, currency,
                    is_starting_price, stripe_price_id ),
      plan_features ( id, label, is_included, detail, sort_order )
    `,
    )
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as PublicPlan[]).map((plan) => ({
    ...plan,
    // Le tri des caractéristiques ne peut pas être demandé à PostgREST sur une
    // relation imbriquée de façon fiable ; il est fait ici, sur un tableau de
    // quelques éléments.
    plan_features: [...plan.plan_features].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

/** Prix d'abonnement mensuel d'une offre, s'il existe. */
export function monthlyPrice(plan: PublicPlan): PlanPrice | undefined {
  return plan.plan_prices.find(
    (price) => price.kind === 'RECURRING' && price.recurring_interval === 'month',
  );
}

/** Frais de création (paiement unique) d'une offre, s'ils existent. */
export function setupPrice(plan: PublicPlan): PlanPrice | undefined {
  return plan.plan_prices.find((price) => price.kind === 'ONE_TIME');
}

/**
 * L'offre est-elle réellement souscriptible en ligne ?
 *
 * Non si elle est sur devis, non si son prix n'existe pas encore côté Stripe.
 * L'interface DOIT s'appuyer sur cette réponse plutôt que d'afficher un bouton
 * « Souscrire » qui mènerait à une erreur Stripe (§57).
 */
export function isPurchasable(plan: PublicPlan): boolean {
  if (plan.requires_quote) return false;
  const price = monthlyPrice(plan);
  return Boolean(price?.stripe_price_id);
}
