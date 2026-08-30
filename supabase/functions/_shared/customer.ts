import type Stripe from 'npm:stripe@^18.0.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.112.4';
import { HttpError } from './http.ts';

/**
 * Le Customer Stripe d'une organisation : le retrouver, ou le créer.
 *
 *
 * UN CUSTOMER, UNE ORGANISATION, POUR TOUJOURS
 *
 * `organizations.stripe_customer_id` porte un index unique et un trigger de
 * garde (`guard_stripe_customer_id`) qui en réserve l'écriture à
 * `service_role`. Le réassigner rattacherait les factures d'un client à un
 * autre : fuite financière dans un sens, facturation erronée dans l'autre.
 *
 * Cette fonction est donc le seul endroit de la plateforme qui écrit cette
 * colonne, et elle ne l'écrit que lorsqu'elle est vide, ou lorsque le Customer
 * référencé n'existe plus chez Stripe.
 */

export interface OrganizationBilling {
  id: string;
  name: string;
  legal_name: string | null;
  billing_email: string | null;
  stripe_customer_id: string | null;
}

const ORGANIZATION_FIELDS = 'id, name, legal_name, billing_email, stripe_customer_id';

export async function loadOrganization(
  admin: SupabaseClient,
  organizationId: string,
): Promise<OrganizationBilling> {
  const { data, error } = await admin
    .from('organizations')
    .select(ORGANIZATION_FIELDS)
    .eq('id', organizationId)
    .maybeSingle();

  if (error) {
    console.error("Lecture de l'organisation impossible :", error);
    throw new HttpError(500, "Votre entreprise n'a pas pu être chargée.");
  }

  if (!data) {
    throw new HttpError(404, 'Entreprise introuvable.');
  }

  return data as OrganizationBilling;
}

/**
 * Renvoie l'identifiant du Customer Stripe, en le créant au besoin.
 *
 * L'adresse de facturation transmise à Stripe est `billing_email` quand elle
 * existe, sinon celle du compte appelant. Stripe l'utilise pour envoyer reçus
 * et relances : une adresse inventée ferait échouer des envois sans que
 * personne ne le sache.
 */
export async function resolveStripeCustomer(
  stripe: Stripe,
  admin: SupabaseClient,
  organization: OrganizationBilling,
  fallbackEmail: string | null,
): Promise<string> {
  if (organization.stripe_customer_id) {
    const existing = await retrieveCustomer(stripe, organization.stripe_customer_id);

    // Un Customer supprimé dans le tableau de bord Stripe reste référencé en
    // base. Le réutiliser ferait échouer le Checkout avec un message que le
    // client ne peut pas comprendre ; on en recrée un et on réécrit la
    // référence.
    if (existing) return existing.id;

    console.warn(
      `Customer ${organization.stripe_customer_id} absent de Stripe : recréation.`,
    );
  }

  const customer = await stripe.customers.create(
    {
      name: organization.legal_name ?? organization.name,
      email: organization.billing_email ?? fallbackEmail ?? undefined,
      // Le lien inverse : depuis le tableau de bord Stripe, on retrouve
      // l'organisation sans consulter la base.
      metadata: { organization_id: organization.id },
    },
    // Clé d'idempotence sur la PREMIÈRE création uniquement. Deux clics
    // simultanés sur « Souscrire » créeraient sinon deux Customers, dont un
    // orphelin qui recevrait des factures que personne ne consulte.
    //
    // Elle est délibérément omise lors d'une recréation : la clé, valable 24 h
    // chez Stripe, renverrait le Customer supprimé qu'on cherche justement à
    // remplacer.
    organization.stripe_customer_id
      ? undefined
      : { idempotencyKey: `org-customer:${organization.id}` },
  );

  const { error } = await admin
    .from('organizations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', organization.id);

  if (error) {
    // Le Customer existe chez Stripe mais la base l'ignore. Poursuivre
    // masquerait l'incohérence : le prochain appel créerait un second
    // Customer, et le webhook ne saurait plus à quelle organisation rattacher
    // les factures.
    console.error('Écriture de stripe_customer_id impossible :', error);
    throw new HttpError(500, "Votre compte de facturation n'a pas pu être enregistré.");
  }

  return customer.id;
}

async function retrieveCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer.deleted ? null : (customer as Stripe.Customer);
  } catch (error) {
    // `resource_missing` est le cas normal d'un Customer effacé ; toute autre
    // erreur (réseau, clé invalide) doit remonter plutôt que de déclencher
    // une recréation silencieuse.
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'resource_missing'
    ) {
      return null;
    }
    throw error;
  }
}
