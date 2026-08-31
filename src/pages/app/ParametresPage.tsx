import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Download, ShieldCheck, Mail } from 'lucide-react';
import { site } from '@/config/site';
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

  const handleExportData = () => {
    if (!user) return;
    const userData = {
      export_date: new Date().toISOString(),
      platform: site.name,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name ?? null,
        created_at: profile?.created_at ?? user.created_at,
        platform_role: profile?.platform_role ?? 'CLIENT',
      },
      notice: 'Conformément à l’article 20 du RGPD (droit à la portabilité), ces données sont fournies dans un format JSON structuré et lisible par machine.',
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hbg-labs-donnees-${user.id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                <CardTitle as="h2">Protection des données & Droits RGPD</CardTitle>
              </div>
              <CardDescription>
                Gérez vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-border bg-surface-muted/30 p-4">
                <div>
                  <h3 className="font-medium text-foreground">Exporter mes données (Portabilité)</h3>
                  <p className="mt-1 text-xs text-muted">
                    Téléchargez l’ensemble des informations associées à votre profil au format JSON lisible par machine (Art. 20 RGPD).
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="shrink-0 inline-flex items-center gap-2"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Exporter mes données
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-border bg-surface-muted/30 p-4">
                <div>
                  <h3 className="font-medium text-foreground">Suppression de compte & Droit à l’effacement</h3>
                  <p className="mt-1 text-xs text-muted">
                    Pour demander la clôture de votre compte et la purge de vos données personnelles (hors obligations légales comptables de 10 ans), adressez votre demande à notre DPO.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0 inline-flex items-center gap-2"
                >
                  <a href={`mailto:${site.contact.dpoEmail}?subject=Demande%20d'effacement%20de%20compte%20RGPD&body=Bonjour,%20je%20souhaite%20exercer%20mon%20droit%20à%20l'effacement%20concernant%20mon%20compte%20client%20${encodeURIComponent(user?.email || '')}.`}>
                    <Mail className="size-4" aria-hidden="true" />
                    Demander la suppression
                  </a>
                </Button>
              </div>

              <p className="text-xs text-muted">
                Pour en savoir plus sur la gestion de vos données et vos droits, consultez notre{' '}
                <a href="/politique-confidentialite" className="text-primary hover:underline font-medium">
                  politique de confidentialité
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
