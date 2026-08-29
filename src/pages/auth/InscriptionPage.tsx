import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  signUpSchema,
  type SignUpInput,
  type SignUpValues,
} from '@/schemas/auth.schema';
import { signUp, AuthFailure } from '@/services/auth.service';
import { Seo } from '@/components/Seo';
import { AuthCard } from '@/layouts/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';

/**
 * Création de compte (§9).
 *
 * Le compte créé n'est rattaché à aucune organisation : c'est HBG Labs qui
 * l'associe à une entreprise cliente. L'écran de destination le dit
 * explicitement plutôt que d'afficher un espace vide sans explication.
 *
 * Aucun rôle n'est transmis à l'inscription. Le trigger `handle_new_user` ne
 * lit que le nom, et `platform_role` conserve sa valeur NULL (migration 02).
 */
export function InscriptionPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await signUp({
        email: values.email,
        password: values.password,
        fullName: values.full_name,
      });

      // Redirection vers l'écran de vérification, y compris si l'adresse était
      // déjà inscrite : le service renvoie le même résultat dans les deux cas,
      // pour ne rien révéler.
      navigate('/verifier-email', { replace: true, state: { email: values.email } });
    } catch (cause) {
      setError(
        cause instanceof AuthFailure
          ? cause.message
          : 'La création du compte a échoué. Réessayez dans un instant.',
      );
    }
  });

  return (
    <>
      <Seo
        title="Créer un compte"
        description="Créez votre compte client HBG Labs pour suivre votre site, votre abonnement et vos demandes."
        path="/inscription"
        noIndex
      />

      <AuthCard
        title="Créer un compte"
        description="Votre espace pour suivre votre site, votre abonnement et vos demandes."
        footer={
          <>
            Vous avez déjà un compte ?{' '}
            <Link to="/connexion" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </>
        }
      >
        {error && (
          <Alert tone="danger" title="Création impossible" className="mb-6">
            <p>{error}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Nom et prénom" error={errors.full_name?.message} required>
            <Input
              {...register('full_name')}
              autoComplete="name"
              autoFocus
              placeholder="Marie Dupont"
            />
          </Field>

          <Field label="Adresse électronique" error={errors.email?.message} required>
            <Input
              {...register('email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="vous@exemple.fr"
            />
          </Field>

          <Field
            label="Mot de passe"
            error={errors.password?.message}
            hint="10 caractères minimum, avec au moins une majuscule, une minuscule et un chiffre."
            required
          >
            <Input
              {...register('password')}
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <Field
            label="Confirmation du mot de passe"
            error={errors.password_confirmation?.message}
            required
          >
            <Input
              {...register('password_confirmation')}
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <div className="space-y-1.5">
            <div className="flex items-start gap-3">
              <input
                {...register('accept_terms')}
                id="accept-terms"
                type="checkbox"
                aria-invalid={errors.accept_terms ? true : undefined}
                aria-describedby={errors.accept_terms ? 'accept-terms-error' : undefined}
                className="mt-0.5 size-4 shrink-0 rounded border-input accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <label htmlFor="accept-terms" className="text-sm leading-relaxed text-muted">
                J’accepte les{' '}
                <Link to="/cgv" className="text-primary hover:underline">
                  conditions générales de vente
                </Link>{' '}
                et la{' '}
                <Link to="/politique-confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                .
              </label>
            </div>

            {errors.accept_terms && (
              <p
                id="accept-terms-error"
                role="alert"
                className="text-sm font-medium text-danger"
              >
                {errors.accept_terms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            loadingLabel="Création du compte en cours"
          >
            Créer mon compte
          </Button>
        </form>
      </AuthCard>
    </>
  );
}
