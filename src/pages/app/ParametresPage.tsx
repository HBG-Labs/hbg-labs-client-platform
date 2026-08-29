import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import {
  changePasswordSchema,
  type ChangePasswordInput,
  type ChangePasswordValues,
} from '@/schemas/auth.schema';
import { changePassword, AuthFailure } from '@/services/auth.service';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile } from '@/features/auth/useProfile';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Layout';

/**
 * Paramètres du compte (§9, changement de mot de passe).
 *
 * Le formulaire demande le mot de passe actuel. `updateUser` ne l'exige pas :
 * sans cette vérification, un poste laissé déverrouillé quelques minutes
 * suffirait à prendre le contrôle du compte.
 *
 * Le nom et le téléphone ne sont pas encore modifiables ici : ils relèvent de
 * la fiche profil du lot 4. Afficher des champs désactivés ferait croire à une
 * fonctionnalité en panne.
 */
export function ParametresPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput, unknown, ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user?.email) return;

    setError(null);
    setSuccess(false);

    try {
      await changePassword(user.email, values.current_password, values.password);
      reset();
      setSuccess(true);
    } catch (cause) {
      setError(
        cause instanceof AuthFailure
          ? cause.message
          : 'La modification a échoué. Réessayez dans un instant.',
      );
    }
  });

  return (
    <>
      <Seo
        title="Paramètres"
        description="Sécurité et informations de votre compte."
        path="/parametres"
        noIndex
      />

      <Container width="narrow" className="py-10 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Paramètres</h1>
        <p className="mt-2 text-muted">Sécurité et informations de votre compte.</p>

        <div className="mt-10 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Votre compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted">Adresse électronique : </span>
                <span className="font-medium">{user?.email}</span>
              </p>
              {profile?.full_name && (
                <p>
                  <span className="text-muted">Nom : </span>
                  <span className="font-medium">{profile.full_name}</span>
                </p>
              )}
              {profile?.created_at && (
                <p>
                  <span className="text-muted">Compte créé le : </span>
                  <span className="font-medium">{formatDate(profile.created_at)}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Changer de mot de passe</CardTitle>
              <CardDescription>
                Votre mot de passe actuel est demandé pour confirmer qu’il s’agit bien de
                vous.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {success && (
                <Alert tone="success" title="Mot de passe modifié" className="mb-6">
                  <p>
                    <CheckCircle2 className="mr-1 inline size-4" aria-hidden="true" />
                    Votre nouveau mot de passe est actif. Vos autres sessions restent
                    ouvertes.
                  </p>
                </Alert>
              )}

              {error && (
                <Alert tone="danger" title="Modification impossible" className="mb-6">
                  <p>{error}</p>
                </Alert>
              )}

              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <Field
                  label="Mot de passe actuel"
                  error={errors.current_password?.message}
                  required
                >
                  <Input
                    {...register('current_password')}
                    type="password"
                    autoComplete="current-password"
                  />
                </Field>

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
                  />
                </Field>

                <Field
                  label="Confirmation du nouveau mot de passe"
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
                  isLoading={isSubmitting}
                  loadingLabel="Modification en cours"
                >
                  Modifier mon mot de passe
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
