import Stripe from 'npm:stripe@^18.0.0';
import { requireEnv } from './env.ts';

/**
 * Client Stripe partagé par les fonctions Edge.
 *
 *
 * LA CLÉ SECRÈTE NE VIT QUE DANS CE RUNTIME
 *
 * `STRIPE_SECRET_KEY` est un secret de fonction Supabase. Elle n'apparaît ni
 * dans `src/`, ni dans le bundle, ni dans les variables `VITE_` — deux
 * garde-fous le vérifient au build (`check-env.mjs`, `check-bundle-secrets.mjs`).
 *
 *
 * AUCUNE VERSION D'API N'EST FORCÉE
 *
 * `apiVersion` n'est pas renseigné volontairement : la bibliothèque épingle
 * déjà la version qui correspond à sa propre publication. Inscrire ici une
 * chaîne de version choisie à la main crée un risque asymétrique — si elle est
 * erronée, chaque appel échoue à l'exécution, sans que rien ne l'ait signalé
 * au déploiement.
 *
 * La version réellement utilisée par un événement reçu est consignée dans
 * `stripe_webhook_events.api_version` : elle reste vérifiable après coup.
 *
 *
 * FETCH PLUTÔT QUE NODE
 *
 * `Stripe.createFetchHttpClient()` remplace la pile HTTP de Node, absente du
 * runtime Deno. Sans lui, le premier appel réseau échoue sur un module
 * introuvable.
 */
export function stripeClient(): Stripe {
  const key = requireEnv('STRIPE_SECRET_KEY');

  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    // Identifie nos appels dans le journal Stripe : utile pour distinguer
    // ce qui vient de la plateforme d'une action manuelle dans le tableau
    // de bord.
    appInfo: { name: 'HBG Labs Client Platform' },
  });
}

/**
 * Fournisseur de cryptographie pour la vérification de signature.
 *
 * En Deno, la vérification passe par `SubtleCrypto`, qui est asynchrone :
 * `constructEvent` (synchrone) échoue, `constructEventAsync` avec ce
 * fournisseur fonctionne. C'est l'unique manière correcte de valider un
 * webhook Stripe dans ce runtime.
 */
export const cryptoProvider = Stripe.createSubtleCryptoProvider();

/**
 * Un montant Stripe peut être `null` (facture sans total, essai gratuit).
 * La base accepte NULL sur ces colonnes ; on ne convertit donc pas en zéro,
 * qui affirmerait « zéro euro » là où l'information est simplement absente.
 */
export function centsOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

/** Horodatage Stripe (secondes UNIX) vers ISO 8601, ou null. */
export function stripeDate(seconds: number | null | undefined): string | null {
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}

/**
 * Extrait un identifiant d'un champ Stripe extensible.
 *
 * Un champ comme `invoice.customer` vaut soit `"cus_123"`, soit l'objet
 * Customer complet lorsqu'il a été développé, soit un objet supprimé. Les
 * trois formes se présentent réellement selon l'événement ; les traiter au cas
 * par cas dans chaque gestionnaire multiplierait les oublis.
 */
export function idOf(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}
