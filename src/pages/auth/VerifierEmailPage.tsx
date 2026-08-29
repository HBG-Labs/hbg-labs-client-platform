import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { resendConfirmation, AuthFailure } from '@/services/auth.service';
import { Seo } from '@/components/Seo';
import { AuthCard } from '@/layouts/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

/**
 * Attente de confirmation d'adresse (§9).
 *
 * Le compte existe mais l'adresse n'est pas vérifiée : Supabase refuse la
 * connexion tant que le lien n'a pas été ouvert.
 *
 * L'adresse est transmise par l'état de navigation, jamais par l'URL. Dans
 * l'URL, elle apparaîtrait dans l'historique du navigateur et dans les
 * journaux du serveur, pour un affichage de confort.
 */
export function VerifierEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;

    setStatus('sending');
    setError(null);

    try {
      await resendConfirmation(email);
      setStatus('sent');
    } catch (cause) {
      setStatus('error');
      setError(
        cause instanceof AuthFailure
          ? cause.message
          : 'L’envoi a échoué. Réessayez dans un instant.',
      );
    }
  }

  return (
    <>
      <Seo
        title="Confirmez votre adresse"
        description="Ouvrez le lien reçu par courriel pour activer votre compte."
        path="/verifier-email"
        noIndex
      />

      <AuthCard
        title="Confirmez votre adresse"
        footer={
          <Link to="/connexion" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        <div className="text-center">
          <MailCheck className="mx-auto size-10 text-primary" aria-hidden="true" />

          <p className="mt-5 leading-relaxed text-muted">
            {email ? (
              <>
                Un lien de confirmation vient d’être envoyé à{' '}
                <strong className="text-foreground">{email}</strong>. Ouvrez-le pour
                activer votre compte.
              </>
            ) : (
              <>
                Un lien de confirmation vous a été envoyé. Ouvrez-le pour activer votre
                compte.
              </>
            )}
          </p>

          <p className="mt-4 text-sm text-muted">
            Le courriel n’arrive pas ? Vérifiez vos indésirables. Le lien reste valable
            une heure.
          </p>
        </div>

        {status === 'sent' && (
          <Alert tone="success" title="Courriel renvoyé" className="mt-6">
            <p>Un nouveau lien vient d’être envoyé.</p>
          </Alert>
        )}

        {status === 'error' && error && (
          <Alert tone="warning" title="Envoi impossible" className="mt-6">
            <p>{error}</p>
          </Alert>
        )}

        {email && (
          <Button
            variant="outline"
            fullWidth
            className="mt-6"
            onClick={() => void handleResend()}
            isLoading={status === 'sending'}
            loadingLabel="Envoi en cours"
            disabled={status === 'sent'}
          >
            Renvoyer le courriel
          </Button>
        )}
      </AuthCard>
    </>
  );
}
