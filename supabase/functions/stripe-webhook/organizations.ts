import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.112.4';
import { IgnoredEvent } from './context.ts';

/**
 * À quelle organisation appartient cet objet Stripe ?
 *
 * Toute écriture dans les tables financières exige un `organization_id` : sans
 * lui, la ligne serait invisible pour son client et comptée nulle part. La
 * question doit donc être tranchée avant tout miroir.
 *
 * Deux chemins, dans cet ordre :
 *
 *   1. LES MÉTADONNÉES. Le Checkout inscrit `organization_id` sur la session et
 *      sur l'abonnement créé. C'est la source la plus directe, et la seule qui
 *      fonctionne avant que `stripe_customer_id` ne soit connu de la base.
 *
 *   2. LE CUSTOMER. `organizations.stripe_customer_id` porte un index unique :
 *      un Customer désigne au plus une organisation. C'est le chemin des
 *      factures et des paiements, qui ne portent pas nos métadonnées.
 *
 * Les métadonnées sont vérifiées en base avant d'être crues : elles sont
 * modifiables depuis le tableau de bord Stripe, et un identifiant erroné y
 * rattacherait des factures à la mauvaise entreprise.
 */
export async function resolveOrganizationId(
  admin: SupabaseClient,
  input: { metadataOrganizationId?: string | null; customerId?: string | null },
): Promise<string> {
  const fromMetadata = input.metadataOrganizationId?.trim();

  if (fromMetadata) {
    const { data, error } = await admin
      .from('organizations')
      .select('id')
      .eq('id', fromMetadata)
      .maybeSingle();

    if (error) throw error;
    if (data) return (data as { id: string }).id;

    console.warn(
      `Métadonnée organization_id=${fromMetadata} inconnue en base ; repli sur le Customer.`,
    );
  }

  if (input.customerId) {
    const { data, error } = await admin
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', input.customerId)
      .maybeSingle();

    if (error) throw error;
    if (data) return (data as { id: string }).id;
  }

  throw new IgnoredEvent(
    `Aucune organisation ne correspond (customer=${input.customerId ?? 'absent'}).`,
  );
}

/**
 * Rattache un Customer Stripe à une organisation qui n'en avait pas encore.
 *
 * Le cas normal est déjà couvert par la fonction Checkout, qui écrit la
 * référence avant d'ouvrir la page de paiement. Celui-ci couvre le reste : un
 * abonnement créé à la main dans le tableau de bord Stripe pour un client
 * existant, dont les métadonnées portent l'organisation mais dont le Customer
 * nous est inconnu.
 *
 * La colonne n'est JAMAIS réécrite si elle porte déjà une valeur, fût-elle
 * différente. Réassigner un Customer déplacerait tout l'historique de
 * facturation d'un client vers un autre ; l'incohérence doit rester visible et
 * être tranchée par un humain.
 */
export async function linkCustomerIfMissing(
  admin: SupabaseClient,
  organizationId: string,
  customerId: string | null,
): Promise<void> {
  if (!customerId) return;

  const { data, error } = await admin
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) throw error;

  const current = (data as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;

  if (current === customerId) return;

  if (current) {
    console.warn(
      `Organisation ${organizationId} déjà liée à ${current} ; ${customerId} non appliqué.`,
    );
    return;
  }

  const { error: updateError } = await admin
    .from('organizations')
    .update({ stripe_customer_id: customerId })
    .eq('id', organizationId);

  if (updateError) throw updateError;
}
