import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  type ResetPasswordValues,
} from '@/schemas/auth.schema';
import { updatePassword, AuthFailure } from '@/services/auth.service';
import { useAuth } from '@/features/auth/auth-context';
import { Seo } from '@/components/Seo';
import { AuthCard } from '@/layouts/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';

/**
 * Définition d'un nouveau mot de passe après clic sur le lien reçu (§9).
 *
 * Le lien ouvre une session de récupération, établie par `/auth/callback`
 * avant d'atteindre cette page. Sans session, le lien est expiré ou déjà
 * consommé : on le dit, plutôt que d'afficher un formulaire dont l'envoi
 * échouerait.
 */
export function ReinitialiserMotDePassePage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput, unknown, ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await updatePassword(values.password);
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof AuthFailure
          ? cause.message
          : 'La modification a échoué. Réessayez dans un instant.',
      );
    }
  });

  if (isLoading) {
    return <LoadingState label="Vérification du lien…" />;
  }

  if (!user) {
    return (
      <>
        <Seo
          title="Lien expiré"
          description="Ce lien de réinitialisation n’est plus valable."
          path="/reinitialiser-mot-de-passe"
          noIndex
        />

        <AuthCard title="Lien expiré ou déjà utilisé">
          <Alert tone="warning">
            <p>
              Ce lien de réinitialisation n’est plus valable. Les liens expirent au bout
              d’une heure et ne servent qu’une fois.
            </p>
          </Alert>

          <Button asChild fullWidth className="mt-6">
            <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
          </Button>
        </AuthCard>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Seo
          title="Mot de passe modifié"
          description="Votre mot de passe a été mis à jour."
          path="/reinitialiser-mot-de-passe"
          noIndex
        />

        <AuthCard title="Mot de passe modifié">
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
            <p className="mt-5 leading-relaxed text-muted">
              Votre mot de passe a été mis à jour. Votre session reste ouverte sur cet
              appareil.
            </p>
            <Button fullWidth className="mt-8" onClick={() => navigate('/dashboard')}>
              Accéder à mon espace
            </Button>
          </div>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Nouveau mot de passe"
        description="Définissez un nouveau mot de passe pour votre espace client."
        path="/reinitialiser-mot-de-passe"
        noIndex
      />

      <AuthCard
        title="Nouveau mot de passe"
        description="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs."
      >
        {error && (
          <Alert tone="danger" title="Modification impossible" className="mb-6">
            <p>{error}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field
            label="Nouveau mot de passe"
            error={errors.password?.message}
            hint="10 caractères minimum, avec au moins une majuscule, une minuscule et un chiffre."
            required
          >
            <Input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              autoFocus
            />
          </Field>

          <Field
            label="Confirmation"
            error={errors.password_confirmation?.message}
            required
          >
            <Input
              {...register('password_confirmation')}
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            loadingLabel="Modification en cours"
          >
            Modifier mon mot de passe
          </Button>
        </form>
      </AuthCard>
    </>
  );
}
