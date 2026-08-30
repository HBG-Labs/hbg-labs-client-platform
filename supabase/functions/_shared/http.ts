/**
 * Réponses HTTP communes aux fonctions Edge.
 *
 * Ce module ne contient aucune logique métier : uniquement la mécanique HTTP
 * répétée par les trois points d'entrée Stripe. La factoriser évite qu'un
 * en-tête CORS diverge d'une fonction à l'autre — un écart qui ne se voit
 * qu'en production, sur un seul navigateur.
 */

/**
 * Origines autorisées à appeler ces fonctions depuis un navigateur.
 *
 * `APP_URL` est l'URL publique de l'application, la même que `VITE_APP_URL`
 * côté client. Elle est renseignée dans les secrets de la fonction.
 *
 * Pourquoi pas `*` : le Checkout et le Portail agissent au nom d'un
 * utilisateur authentifié, sur la base de son jeton. Autoriser toutes les
 * origines laisserait n'importe quelle page tierce déclencher ces appels avec
 * le jeton d'un visiteur connecté.
 *
 * Le webhook, lui, n'utilise pas ces en-têtes : Stripe n'est pas un navigateur
 * et n'émet pas de requête préalable.
 */
function allowedOrigins(): string[] {
  const configured = Deno.env.get('APP_URL');
  return [configured, 'http://localhost:5173'].filter(
    (value): value is string => Boolean(value),
  );
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowed = allowedOrigins();

  return {
    'Access-Control-Allow-Origin':
      origin && allowed.includes(origin) ? origin : (allowed[0] ?? ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

/**
 * Erreur destinée au client, avec son code HTTP.
 *
 * Le message est affiché tel quel dans l'interface : il doit rester
 * compréhensible et ne jamais exposer d'identifiant Stripe ni de détail
 * interne.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Enveloppe commune : CORS, méthode, et conversion des erreurs.
 *
 * Une exception inattendue ne doit pas renvoyer sa pile au navigateur — elle
 * nommerait des fichiers, des variables, parfois des identifiants. Elle est
 * journalisée côté serveur et devient un message générique côté client.
 */
export async function handleRequest(
  request: Request,
  handler: (request: Request) => Promise<Response>,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Méthode non autorisée.' }, 405);
  }

  try {
    return await handler(request);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(request, { error: error.message }, error.status);
    }

    console.error('Erreur non gérée :', error);
    return jsonResponse(
      request,
      { error: "L'opération a échoué. Réessayez dans un instant." },
      500,
    );
  }
}
