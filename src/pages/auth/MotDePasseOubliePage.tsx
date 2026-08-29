import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  type ForgotPasswordValues,
} from '@/schemas/auth.schema';
import { requestPasswordReset, AuthFailure } from '@/services/auth.service';
import { Seo } from '@/components/Seo';
import { AuthCard } from '@/layouts/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';

/**
 * Demande de réinitialisation du mot de passe (§9).
 *
 * La confirmation est la même que l'adresse existe ou non. Répondre « aucun
 * compte à cette adresse » permettrait de vérifier qui est client de HBG Labs
 * sans jamais se connecter.
 */
export function MotDePasseOubliePage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput, unknown, ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
      setSent(true);
    } catch (cause) {
      // Seule la limitation de débit remonte jusqu'ici : le service absorbe
      // les autres erreurs pour ne pas trahir l'existence du compte.
      setError(
        cause instanceof AuthFailure
          ? cause.message
          : 'L’envoi a échoué. Réessayez dans un instant.',
      );
    }
  });

  if (sent) {
    return (
      <>
        <Seo
          title="Courriel envoyé"
          description="Un lien de réinitialisation vous a été envoyé."
          path="/mot-de-passe-oublie"
          noIndex
        />

        <AuthCard title="Vérifiez votre boîte de réception">
          <div className="text-center">
            <MailCheck className="mx-auto size-10 text-success" aria-hidden="true" />

            <p className="mt-5 leading-relaxed text-muted">
              Si un compte existe pour <strong className="text-foreground">{submittedEmail}</strong>,
              un lien de réinitialisation vient d’y être envoyé. Il reste valable une heure.
            </p>

            <p className="mt-4 text-sm text-muted">
              Le courriel n’arrive pas ? Vérifiez vos indésirables avant de recommencer.
            </p>

            <Button asChild variant="outline" fullWidth className="mt-8">
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
        title="Mot de passe oublié"
        description="Recevez un lien pour réinitialiser le mot de passe de votre espace client."
        path="/mot-de-passe-oublie"
        noIndex
      />

      <AuthCard
        title="Mot de passe oublié"
        description="Indiquez votre adresse électronique. Nous vous enverrons un lien pour définir un nouveau mot de passe."
        footer={
          <Link to="/connexion" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        {error && (
          <Alert tone="warning" title="Envoi impossible" className="mb-6">
            <p>{error}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Adresse électronique" error={errors.email?.message} required>
            <Input
              {...register('email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              autoFocus
              placeholder="vous@exemple.fr"
            />
          </Field>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            loadingLabel="Envoi du lien en cours"
          >
            Envoyer le lien
          </Button>
        </form>
      </AuthCard>
    </>
  );
}
