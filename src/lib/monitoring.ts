import { env } from './env';

/**
 * Supervision des erreurs (§17).
 *
 *
 * CHARGÉ À LA DEMANDE, JAMAIS DANS LE BUNDLE INITIAL
 *
 * Le SDK Sentry pèse une trentaine de kilo-octets compressés. §42 impose le
 * chargement paresseux par page — « l'accueil ne télécharge pas les CGV » — et
 * une bibliothèque de supervision embarquée dans le bundle initial
 * contredirait cette règle pour tous les visiteurs du site public.
 *
 * L'import dynamique a un coût assumé : les erreurs survenant avant la fin du
 * chargement du SDK ne sont pas remontées. C'est une fenêtre de quelques
 * centaines de millisecondes, contre un ralentissement du premier affichage
 * pour chaque visiteur. `initMonitoring` est appelé au démarrage, avant même le
 * premier rendu, ce qui la réduit d'autant.
 *
 *
 * SANS DSN, RIEN NE SE CHARGE
 *
 * `VITE_SENTRY_DSN` vide — le cas aujourd'hui — et le module n'est même pas
 * téléchargé. La supervision est absente, et l'application ne prétend pas le
 * contraire : `reportError` retombe sur la console.
 *
 *
 * AUCUNE DONNÉE PERSONNELLE N'EST TRANSMISE
 *
 * Ni identifiant d'utilisateur, ni adresse électronique, ni contenu de
 * formulaire. `sendDefaultPii` reste à `false`, et `beforeBreadcrumb` retire la
 * chaîne de requête des appels à l'API : une requête PostgREST porte ses
 * filtres dans l'URL, et `profiles?email=eq.…` suffirait à faire sortir une
 * adresse client vers un prestataire américain.
 *
 * Une trace d'erreur n'a pas besoin de nommer quelqu'un pour être exploitable.
 * Si le contexte manque, il se demande — la plateforme a un fil de demandes
 * pour cela.
 */

type SentryModule = typeof import('@sentry/react');

/**
 * Le module, une fois chargé. `null` tant qu'il ne l'est pas — ce qui inclut
 * le cas normal où aucun DSN n'est configuré.
 */
let sentry: SentryModule | null = null;

/** Vrai dès qu'un DSN est configuré, même avant la fin du chargement. */
export const isMonitoringConfigured = Boolean(env.VITE_SENTRY_DSN);

export async function initMonitoring(): Promise<void> {
  if (!isMonitoringConfigured || sentry) return;

  try {
    const module = await import('@sentry/react');

    module.init({
      dsn: env.VITE_SENTRY_DSN,
      environment: env.VITE_APP_ENV,

      // Aucune donnée personnelle par défaut : ni adresse IP, ni cookie, ni
      // en-tête de requête.
      sendDefaultPii: false,

      // Pas de traçage de performance : il échantillonne des transactions
      // portant les URL visitées, pour un besoin que la plateforme n'a pas
      // encore. La supervision demandée par §17 porte sur les ERREURS.
      tracesSampleRate: 0,

      beforeBreadcrumb(breadcrumb) {
        if (typeof breadcrumb.data?.url === 'string') {
          breadcrumb.data.url = stripQuery(breadcrumb.data.url);
        }
        return breadcrumb;
      },

      beforeSend(event) {
        if (event.request?.url) {
          event.request.url = stripQuery(event.request.url);
        }
        return event;
      },
    });

    sentry = module;
  } catch (cause) {
    // L'échec du chargement de la supervision ne doit pas empêcher
    // l'application de fonctionner : elle observe, elle ne sert à rien d'autre.
    console.warn('Supervision indisponible :', cause);
  }
}

/**
 * Remonte une erreur, ou la journalise si la supervision n'est pas configurée.
 *
 * `context` décrit l'endroit, jamais la personne : « chargement des factures »,
 * pas l'identifiant du client concerné.
 */
export function reportError(error: unknown, context?: Record<string, string>): void {
  if (sentry) {
    sentry.captureException(error, context ? { extra: context } : undefined);
    return;
  }

  console.error('[erreur]', context ?? {}, error);
}

/**
 * Retire la chaîne de requête d'une URL.
 *
 * PostgREST porte ses filtres dans l'URL : `profiles?email=eq.a@b.fr`,
 * `support_messages?ticket_id=eq.<uuid>`. Le chemin seul suffit à savoir quelle
 * requête a échoué ; les valeurs, elles, sont des données clientes.
 */
function stripQuery(url: string): string {
  const cut = url.indexOf('?');
  return cut === -1 ? url : `${url.slice(0, cut)}?…`;
}
