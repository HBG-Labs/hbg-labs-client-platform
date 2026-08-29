import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  signInSchema,
  type SignInInput,
  type SignInValues,
} from '@/schemas/auth.schema';
import { signIn, AuthFailure } from '@/services/auth.service';
import { Seo } from '@/components/Seo';
import { AuthCard } from '@/layouts/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';

/**
 * Connexion (§9).
 *
 * Le message d'échec est identique quelle que soit la cause : adresse inconnue
 * ou mot de passe erroné. Distinguer les deux transformerait ce formulaire en
 * outil pour savoir qui est client de HBG Labs.
 */
export function ConnexionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput, unknown, SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  // Page demandée avant la redirection vers la connexion, posée par RequireAuth.
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setNeedsConfirmation(false);

    try {
      await signIn(values.email, values.password);
      navigate(from, { replace: true });
    } catch (cause) {
      if (cause instanceof AuthFailure) {
        setError(cause.message);
        setNeedsConfirmation(cause.code === 'email_not_confirmed');
        return;
      }
      setError('La connexion a échoué. Réessayez dans un instant.');
    }
  });

  return (
    <>
      <Seo
        title="Connexion"
        description="Accédez à votre espace client HBG Labs."
        path="/connexion"
        noIndex
      />

      <AuthCard
        title="Connexion"
        description="Accédez à votre espace client."
        footer={
          <>
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="font-medium text-primary hover:underline">
              Créer un compte
            </Link>
          </>
        }
      >
        {error && (
          <Alert tone="danger" title="Connexion impossible" className="mb-6">
            <p>{error}</p>
            {needsConfirmation && (
              <p className="mt-2">
                <Link
                  to="/verifier-email"
                  state={{ email: getValues('email') }}
                  className="font-medium underline"
                >
                  Renvoyer le courriel de confirmation
                </Link>
              </p>
            )}
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

          <Field label="Mot de passe" error={errors.password?.message} required>
            <Input
              {...register('password')}
              type="password"
              autoComplete="current-password"
            />
          </Field>

          <p className="text-sm">
            <Link
              to="/mot-de-passe-oublie"
              className="text-muted hover:text-foreground hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </p>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            loadingLabel="Connexion en cours"
          >
            Se connecter
          </Button>
        </form>
      </AuthCard>
    </>
  );
}
