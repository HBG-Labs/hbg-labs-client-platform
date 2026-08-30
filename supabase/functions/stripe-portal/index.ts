import { handleRequest, jsonResponse, HttpError } from '../_shared/http.ts';
import { stripeClient, requireEnv } from '../_shared/stripe.ts';
import { adminClient, callerClient, requireOrgOwner, requireUser } from '../_shared/supabase.ts';
import { loadOrganization } from '../_shared/customer.ts';

/**
 * Portail de facturation Stripe (§19, §23).
 *
 *
 * POURQUOI DÉLÉGUER PLUTÔT QUE CONSTRUIRE
 *
 * Changer de carte, télécharger une facture, résilier, mettre à jour l'adresse
 * de facturation : le portail hébergé par Stripe fait tout cela, en conformité
 * PCI, dans la langue du client, sans qu'aucune donnée bancaire ne traverse la
 * plateforme.
 *
 * Reconstruire ces écrans supposerait de manipuler des moyens de paiement, donc
 * d'entrer dans le périmètre PCI-DSS — pour un résultat moins complet. §19 ne
 * demande d'ailleurs rien d'autre : « portail client Stripe ».
 *
 *
 * CE QUE LE CLIENT Y FAIT NOUS REVIENT PAR LE WEBHOOK
 *
 * Une résiliation depuis le portail ne passe par aucun code à nous. Elle
 * produit un `customer.subscription.updated`, que le webhook applique au
 * miroir local. C'est la même mécanique que pour une modification faite par
 * HBG Labs dans le tableau de bord Stripe : une seule source de vérité, un
 * seul chemin d'écriture.
 */

interface PortalRequest {
  organization_id?: unknown;
}

Deno.serve((request) =>
  handleRequest(request, async (req) => {
    const body = (await req.json().catch(() => ({}))) as PortalRequest;
    const organizationId = asUuid(body.organization_id);

    const caller = callerClient(req);
    await requireUser(caller);
    await requireOrgOwner(caller, organizationId);

    const admin = adminClient();
    const organization = await loadOrganization(admin, organizationId);

    // Aucun Customer : l'organisation n'a jamais rien payé. Le portail
    // s'ouvrirait sur une page vide, ou pas du tout. On le dit.
    if (!organization.stripe_customer_id) {
      throw new HttpError(
        409,
        "Aucun compte de facturation n'existe encore pour votre entreprise.",
      );
    }

    const stripe = stripeClient();

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: organization.stripe_customer_id,
        locale: 'fr',
        return_url: `${requireEnv('APP_URL')}/dashboard/facturation`,
      });

      return jsonResponse(req, { url: session.url });
    } catch (error) {
      // Cause de loin la plus fréquente en mode test : le portail n'a jamais
      // été configuré dans le tableau de bord Stripe. L'erreur brute parle de
      // « default configuration », ce qui n'évoque rien au client.
      if (isPortalNotConfigured(error)) {
        console.error('Portail de facturation non configuré côté Stripe :', error);
        throw new HttpError(
          503,
          'La gestion en ligne de la facturation est momentanément indisponible. Écrivez-nous et nous nous en occupons.',
        );
      }

      throw error;
    }
  }),
);

function asUuid(value: unknown): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof value !== 'string' || !uuid.test(value)) {
    throw new HttpError(400, 'Requête incomplète : organization_id est absent ou invalide.');
  }

  return value;
}

function isPortalNotConfigured(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const { message } = error as { message?: string };
  return typeof message === 'string' && message.includes('configuration');
}
