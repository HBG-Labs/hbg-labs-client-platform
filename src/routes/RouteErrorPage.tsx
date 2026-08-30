import { useEffect } from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { reportError } from '@/lib/monitoring';
import { Button } from '@/components/ui/Button';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Erreurs remontées par le routeur (§17).
 *
 *
 * CE QU'ELLE CORRIGE
 *
 * `errorElement` valait `<NotFoundPage />` : toute erreur du routeur devenait
 * « page introuvable ». C'est exact pour une adresse inconnue, faux pour tout
 * le reste — et le cas le plus fréquent n'est pas une adresse inconnue mais un
 * ÉCHEC DE CHARGEMENT DE MODULE.
 *
 * Les pages sont chargées à la demande (§42). Après un déploiement, les noms
 * de fichiers changent : un onglet resté ouvert demande un morceau de code qui
 * n'existe plus. L'utilisateur voit alors « cette adresse ne correspond à
 * aucune page », alors que la page existe et qu'un simple rechargement la
 * ramène. Le message envoie exactement à l'opposé du geste utile.
 *
 * Les erreurs de routeur n'atteignent pas `AppErrorBoundary` : React Router les
 * intercepte avant. Sans cet écran, elles ne seraient donc jamais remontées à
 * la supervision.
 */

export function RouteErrorPage() {
  const error = useRouteError();

  // Une adresse inconnue n'est pas un incident : elle ne remonte nulle part.
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (isNotFound) return;
    reportError(error, { origine: 'routeur' });
  }, [error, isNotFound]);

  if (isNotFound) return <NotFoundPage />;

  const message =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : 'Cause inconnue.';

  return (
    <div
      role="alert"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-2xl font-semibold">Cette page n’a pas pu se charger</h1>

      <p className="max-w-md text-muted">
        Le plus souvent, une nouvelle version de la plateforme vient d’être mise en
        ligne pendant que cet onglet était ouvert. Recharger suffit.
      </p>

      {/* Le message réel est affiché, jamais remplacé par un texte rassurant :
          même règle que `ErrorState`. */}
      <p className="max-w-md rounded-md border border-border bg-surface px-4 py-3 font-mono text-xs text-muted">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => window.location.reload()}>
          Recharger la page
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Revenir à l’accueil</Link>
        </Button>
      </div>
    </div>
  );
}
