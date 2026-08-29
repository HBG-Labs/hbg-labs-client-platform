import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { Seo } from '@/components/Seo';
import { AuthCard } from '@/layouts/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';

/**
 * Retour des liens reçus par courriel : confirmation d'adresse et
 * réinitialisation de mot de passe (§9).
 *
 * L'échange du code contre une session est fait par supabase-js lui-même, grâce
 * à `detectSessionInUrl` (voir `src/lib/supabase.ts`). Appeler
 * `exchangeCodeForSession` ici consommerait le code une seconde fois et
 * échouerait. Cette page se contente donc d'attendre que la session apparaisse,
 * puis redirige.
 *
 * Les erreurs arrivent en paramètres d'URL. Supabase les place tantôt dans la
 * chaîne de requête, tantôt dans le fragment selon le type de lien : les deux
 * sont lus.
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Erreur transmise par Supabase, en requête ou en fragment.
  const hashParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '',
  );
  const errorCode = searchParams.get('error') ?? hashParams.get('error');
  const errorDescription =
    searchParams.get('error_description') ?? hashParams.get('error_description');

  const next = searchParams.get('next') ?? '/dashboard';

  useEffect(() => {
    if (errorCode) return;

    if (!isLoading && user) {
      navigate(next, { replace: true });
      return;
    }

    if (isLoading) return;

    // Session absente une fois la résolution terminée : le lien est expiré,
    // déjà consommé, ou ouvert dans un navigateur différent de celui qui a
    // lancé la demande. Un délai laisse à supabase-js le temps de traiter
    // l'URL avant de conclure.
    const timer = window.setTimeout(() => setTimedOut(true), 3000);
    return () => window.clearTimeout(timer);
  }, [errorCode, isLoading, user, navigate, next]);

  if (errorCode || timedOut) {
    const expired =
      errorCode === 'access_denied' || errorDescription?.includes('expired');

    return (
      <>
        <Seo
          title="Lien invalide"
          description="Ce lien de connexion n’est plus valable."
          path="/auth/callback"
          noIndex
        />

        <AuthCard title={expired ? 'Lien expiré' : 'Lien invalide'}>
          <Alert tone="warning">
            <p>
              {expired
                ? 'Ce lien a expiré ou a déjà été utilisé. Les liens envoyés par courriel restent valables une heure et ne servent qu’une fois.'
                : 'Ce lien n’a pas pu être validé. Il a peut-être été tronqué par votre messagerie, ou ouvert dans un autre navigateur que celui d’origine.'}
            </p>
          </Alert>

          <div className="mt-6 space-y-3">
            <Button asChild fullWidth>
              <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
            </Button>
            <Button asChild variant="outline" fullWidth>
              <Link to="/connexion">Retour à la connexion</Link>
            </Button>
          </div>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Connexion en cours"
        description="Validation de votre lien de connexion."
        path="/auth/callback"
        noIndex
      />
      <LoadingState label="Validation de votre lien…" />
    </>
  );
}
