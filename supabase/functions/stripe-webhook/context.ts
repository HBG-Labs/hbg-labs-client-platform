import type Stripe from 'npm:stripe@^18.0.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.112.4';

/**
 * Contexte transmis à chaque gestionnaire d'événement.
 *
 * `eventAt` est l'horodatage porté par l'événement Stripe, pas l'heure de
 * réception. C'est lui qui départage deux versions d'un même objet : Stripe ne
 * garantit pas l'ordre de livraison, et l'heure d'arrivée reflète l'ordre des
 * relivraisons, pas celui des faits.
 */
export interface MirrorContext {
  admin: SupabaseClient;
  stripe: Stripe;
  event: Stripe.Event;
  eventAt: string;
}

/**
 * Événement délibérément non reflété, avec sa raison.
 *
 * Ce n'est pas une erreur : l'événement est acquitté, Stripe ne le rejoue pas.
 * La raison est consignée dans `stripe_webhook_events.error`, ce qui rend ces
 * cas dénombrables — un événement ignoré en silence ne se découvre que le jour
 * où quelqu'un cherche pourquoi une facture manque.
 *
 * Trois situations le justifient :
 *
 *   * le Customer Stripe ne correspond à aucune organisation connue (objet
 *     créé à la main dans le tableau de bord, ou venu d'une autre intégration) ;
 *   * l'événement est plus ancien que l'état déjà enregistré ;
 *   * la donnée reçue ne peut pas entrer dans le schéma sans être déformée.
 *
 * Dans les trois cas, répondre 500 déclencherait des relivraisons indéfinies
 * pour un événement qui n'aboutira jamais.
 */
export class IgnoredEvent extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'IgnoredEvent';
  }
}

/**
 * L'état déjà enregistré est-il plus récent que l'événement reçu ?
 *
 * Comparaison sur l'horodatage Stripe. À égalité, l'événement est appliqué :
 * deux événements de la même seconde décrivent le même instant, et refuser le
 * second laisserait passer une mise à jour légitime.
 */
export function isStale(storedEventAt: string | null, eventAt: string): boolean {
  if (!storedEventAt) return false;
  return new Date(eventAt).getTime() < new Date(storedEventAt).getTime();
}
