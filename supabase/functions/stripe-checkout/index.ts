import { handleRequest, jsonResponse, HttpError } from '../_shared/http.ts';
import { stripeClient } from '../_shared/stripe.ts';
import { requireEnv } from '../_shared/env.ts';
import {
  adminClient,
  callerClient,
  requireOrgOwner,
  requireUser,
} from '../_shared/supabase.ts';
import { loadOrganization, resolveStripeCustomer } from '../_shared/customer.ts';

/**
 * Ouverture d'une session Stripe Checkout (§19).
 *
 *
 * CE QUE CETTE FONCTION NE FAIT PAS
 *
 * Elle n'active aucun abonnement, n'écrit aucune ligne dans `subscriptions` et
 * ne considère jamais un paiement comme abouti. Elle prépare une page de
 * paiement et rend son URL. L'état de l'abonnement viendra du webhook, seul
 * chemin d'écriture des tables financières (§20, §22).
 *
 * Un utilisateur qui ferme l'onglet Stripe, ou dont la carte est refusée,
 * laisse donc la plateforme exactement dans l'état où il l'a trouvée.
 *
 *
 * TROIS VÉRIFICATIONS, DANS CET ORDRE
 *
 *   1. Qui appelle — le jeton est vérifié par le runtime, puis relu ici pour
 *      obtenir l'identité.
 *   2. Ce qu'il a le droit de faire — `is_org_owner`, la fonction qui fonde
 *      déjà les policies de facturation. Un MANAGER est écarté : « gestion
 *      opérationnelle, sans accès à la facturation ».
 *   3. Ce qui est réellement souscriptible — le prix est relu EN BASE, avec le
 *      jeton de l'appelant, donc à travers la RLS. Le montant facturé est
 *      celui du catalogue, jamais un montant transmis par le navigateur.
 *
 * Le troisième point est le plus important. Si le client choisissait le prix,
 * il choisirait le montant : il suffirait de modifier la requête pour
 * s'abonner à un euro.
 */

/** Statuts qui décrivent un abonnement encore en vie chez Stripe. */
const LIVE_SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'incomplete',
];

interface CheckoutRequest {
  organization_id?: unknown;
  plan_price_id?: unknown;
}

interface PlanPriceRow {
  id: string;
  plan_id: string;
  kind: string;
  is_active: boolean;
  stripe_price_id: string | null;
  is_starting_price: boolean;
  plan: { requires_quote: boolean } | { requires_quote: boolean }[] | null;
}

const PRICE_FIELDS =
  'id, plan_id, kind, is_active, stripe_price_id, is_starting_price, plan:plans ( requires_quote )';

Deno.serve((request) =>
  handleRequest(request, async (req) => {
    const body = (await req.json().catch(() => ({}))) as CheckoutRequest;
    const organizationId = asUuid(body.organization_id, 'organization_id');
    const planPriceId = asUuid(body.plan_price_id, 'plan_price_id');

    const caller = callerClient(req);
    const user = await requireUser(caller);
    await requireOrgOwner(caller, organizationId);

    const admin = adminClient();
    const stripe = stripeClient();

    // ---- Le prix, tel que la base le connaît -------------------------------
    const price = await loadRecurringPrice(caller, planPriceId);
    const setupFee = await loadSetupFee(caller, price.plan_id);

    // ---- Un seul abonnement en cours par organisation ----------------------
    await refuseIfAlreadySubscribed(admin, organizationId);

    // ---- Customer Stripe ---------------------------------------------------
    const organization = await loadOrganization(admin, organizationId);
    const customerId = await resolveStripeCustomer(stripe, admin, organization, user.email);

    // ---- Session de paiement ----------------------------------------------
    const appUrl = requireEnv('APP_URL');

    const lineItems = [{ price: price.stripe_price_id as string, quantity: 1 }];

    // Les frais de création accompagnent le premier prélèvement : Stripe les
    // porte sur la première facture de l'abonnement, ce qui évite au client un
    // second parcours de paiement.
    if (setupFee?.stripe_price_id) {
      lineItems.push({ price: setupFee.stripe_price_id, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      locale: 'fr',
      line_items: lineItems,

      // Deux chemins pour retrouver l'organisation depuis un événement :
      // `client_reference_id` sur la session, et les métadonnées portées par
      // l'abonnement créé. Le webhook n'a ainsi pas besoin de remonter au
      // Customer pour les événements d'abonnement.
      client_reference_id: organizationId,
      metadata: { organization_id: organizationId, plan_id: price.plan_id },
      subscription_data: {
        metadata: { organization_id: organizationId, plan_id: price.plan_id },
      },

      allow_promotion_codes: true,

      // L'écran de retour n'annonce pas le succès : il affiche « en cours de
      // confirmation » jusqu'à l'arrivée du webhook (contrat §3.3).
      success_url: `${appUrl}/dashboard/facturation?paiement=retour`,
      cancel_url: `${appUrl}/dashboard/facturation?paiement=annule`,
    });

    if (!session.url) {
      throw new HttpError(502, "Stripe n'a pas renvoyé de page de paiement.");
    }

    return jsonResponse(req, { url: session.url });
  }),
);

/**
 * PostgREST rend une relation « vers un » tantôt comme objet, tantôt comme
 * tableau à un élément selon la façon dont il infère la cardinalité. Les deux
 * formes sont acceptées ici : une lecture qui n'en connaîtrait qu'une laisserait
 * passer les offres sur devis le jour où l'autre se présente.
 */
function requiresQuote(price: PlanPriceRow): boolean {
  const plan = Array.isArray(price.plan) ? price.plan[0] : price.plan;
  return plan?.requires_quote === true;
}

function asUuid(value: unknown, field: string): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof value !== 'string' || !uuid.test(value)) {
    throw new HttpError(400, `Requête incomplète : ${field} est absent ou invalide.`);
  }

  return value;
}

/**
 * Charge le prix récurrent choisi, AVEC LE JETON DE L'APPELANT.
 *
 * La policy `plan_prices_select_public` n'expose qu'un prix actif d'un plan
 * public et actif. Un prix retiré du catalogue est donc introuvable ici, même
 * si son identifiant est connu — la base refuse, sans qu'aucun filtre
 * applicatif n'ait à s'en souvenir.
 */
async function loadRecurringPrice(
  caller: ReturnType<typeof callerClient>,
  planPriceId: string,
): Promise<PlanPriceRow> {
  const { data, error } = await caller
    .from('plan_prices')
    .select(PRICE_FIELDS)
    .eq('id', planPriceId)
    .maybeSingle();

  if (error) {
    console.error('Lecture du prix impossible :', error);
    throw new HttpError(500, "L'offre n'a pas pu être chargée.");
  }

  if (!data) {
    throw new HttpError(404, "Cette offre n'est pas disponible.");
  }

  const price = data as PlanPriceRow;

  if (price.kind !== 'RECURRING') {
    throw new HttpError(400, "Cette offre n'est pas un abonnement.");
  }

  // La policy publique n'expose que les prix actifs, mais
  // `plan_prices_select_staff` élargit la lecture à tout le catalogue : un
  // membre de HBG Labs souscrivant pour sa propre entreprise pourrait atteindre
  // un tarif retiré. Le contrôle porte ici sur la donnée, pas sur le lecteur.
  if (!price.is_active) {
    throw new HttpError(409, "Cette offre n'est plus proposée.");
  }

  // Le catalogue peut porter un prix Stripe sur une offre qui reste soumise à
  // devis, ou dont le montant n'est qu'un point de départ (§7). L'interface
  // écarte déjà ces offres du Checkout ; la règle est répétée ici parce que
  // c'est le serveur qui l'applique — le navigateur choisit l'identifiant du
  // prix, et rien ne l'empêche d'en choisir un autre.
  if (requiresQuote(price) || price.is_starting_price) {
    throw new HttpError(
      409,
      'Le tarif de cette offre est établi après étude. Demandez un devis.',
    );
  }

  if (!price.stripe_price_id) {
    // Le catalogue Stripe n'a pas encore été synchronisé pour cette offre. Le
    // message le dit, plutôt que de laisser Stripe répondre au client une
    // erreur technique qu'il ne peut pas interpréter (§57).
    throw new HttpError(
      409,
      "Cette offre n'est pas encore souscriptible en ligne. Demandez un devis.",
    );
  }

  return price;
}

/**
 * Frais de création à joindre à la première facture, s'ils existent.
 *
 * `is_starting_price` en écarte le prélèvement automatique : un tarif « à
 * partir de 590 € » n'est pas un montant ferme (§7). Le facturer tel quel
 * prélèverait une somme que le devis peut contredire. Ces offres passent par le
 * formulaire de devis, pas par le Checkout.
 */
async function loadSetupFee(
  caller: ReturnType<typeof callerClient>,
  planId: string,
): Promise<PlanPriceRow | null> {
  // `is_active` est filtré explicitement : sans lui, un lecteur qui voit tout le
  // catalogue — le personnel — ramènerait aussi les tarifs retirés, et
  // `maybeSingle` échouerait sur plusieurs lignes. La contrainte
  // `plan_prices_one_active_per_combination` garantit alors l'unicité, à la
  // devise près.
  const { data, error } = await caller
    .from('plan_prices')
    .select(PRICE_FIELDS)
    .eq('plan_id', planId)
    .eq('kind', 'ONE_TIME')
    .eq('is_active', true)
    .eq('is_starting_price', false)
    .not('stripe_price_id', 'is', null)
    .maybeSingle();

  if (error) {
    console.error('Lecture des frais de création impossible :', error);
    throw new HttpError(500, "L'offre n'a pas pu être chargée.");
  }

  return (data as PlanPriceRow | null) ?? null;
}

/**
 * Refuse un second abonnement à une organisation qui en a déjà un.
 *
 * Sans ce contrôle, un client qui revient sur la page tarifs et resouscrit se
 * retrouve avec deux abonnements actifs et deux prélèvements mensuels. Stripe
 * l'accepte sans broncher : rien, de son point de vue, ne distingue ce cas d'un
 * client qui souscrit délibérément une seconde offre.
 *
 * La lecture se fait avec `service_role` : le contrôle doit valoir quel que
 * soit le lecteur, alors que la RLS n'expose l'abonnement qu'aux membres de
 * l'organisation.
 */
async function refuseIfAlreadySubscribed(
  admin: ReturnType<typeof adminClient>,
  organizationId: string,
): Promise<void> {
  const { data, error } = await admin
    .from('subscriptions')
    .select('id, status')
    .eq('organization_id', organizationId)
    .in('status', LIVE_SUBSCRIPTION_STATUSES)
    .limit(1);

  if (error) {
    console.error('Lecture des abonnements impossible :', error);
    throw new HttpError(500, "Votre abonnement n'a pas pu être vérifié.");
  }

  if ((data ?? []).length > 0) {
    throw new HttpError(
      409,
      'Un abonnement est déjà en cours. Gérez-le depuis votre espace de facturation.',
    );
  }
}
