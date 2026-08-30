import { Link } from 'react-router-dom';
import { Building2, Globe, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useMyOrganizations, useProfile } from '@/features/auth/useProfile';
import { ORG_ROLE_LABELS, PLATFORM_ROLE_LABELS } from '@/types/domain';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Tableau de bord client.
 *
 * Le §14 décrit un tableau de bord affichant le site, le domaine, l'abonnement,
 * la prochaine échéance et les demandes en cours. Le site et le domaine ont
 * désormais leurs écrans ; l'abonnement et la facturation dépendent de Stripe,
 * qui n'écrit pas encore.
 *
 * Cette page ne montre donc que ce qui existe réellement en base. Poser une
 * tuile « Abonnement : Pro » avec une valeur inventée reviendrait à livrer une
 * maquette en la présentant comme un produit (§57).
 */
export function DashboardPage() {
  const { user } = useAuth();
  const profile = useProfile();
  const organizations = useMyOrganizations();

  const firstName = profile.data?.full_name?.split(' ')[0] ?? '';

  return (
    <>
      <Seo
        title="Tableau de bord"
        description="Votre espace client HBG Labs."
        path="/dashboard"
        noIndex
      />

      <Container className="py-10 sm:py-14">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Bonjour{firstName ? ` ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-muted">{user?.email}</p>

          {profile.data?.platform_role && (
            <div className="mt-4">
              <StatusBadge
                tone="info"
                label={`Équipe HBG Labs : ${PLATFORM_ROLE_LABELS[profile.data.platform_role]}`}
              />
            </div>
          )}
        </header>

        {/* ---- Organisations ---- */}
        <section aria-labelledby="titre-organisations" className="mb-10">
          <h2 id="titre-organisations" className="mb-4 text-lg font-semibold">
            Votre entreprise
          </h2>

          {organizations.isPending && <LoadingState label="Chargement de vos accès…" />}

          {organizations.isError && (
            <ErrorState
              title="Vos accès n’ont pas pu être chargés"
              error={organizations.error}
              onRetry={() => void organizations.refetch()}
            />
          )}

          {organizations.isSuccess && organizations.data.length === 0 && (
            <EmptyState
              icon={Building2}
              title="Aucune entreprise rattachée à votre compte"
              description="Votre compte est créé mais n’est encore relié à aucune organisation. C’est HBG Labs qui effectue ce rattachement lors de la mise en place de votre projet."
              action={
                <Button asChild variant="outline">
                  <Link to="/contact">Nous contacter</Link>
                </Button>
              }
            />
          )}

          {organizations.isSuccess && organizations.data.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {organizations.data.map((membership) => (
                <Card key={membership.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle as="h3">{membership.organization.name}</CardTitle>
                      <StatusBadge
                        tone={
                          membership.organization.status === 'ACTIVE'
                            ? 'success'
                            : membership.organization.status === 'SUSPENDED'
                              ? 'warning'
                              : 'neutral'
                        }
                        label={
                          membership.organization.status === 'ACTIVE'
                            ? 'Active'
                            : membership.organization.status === 'SUSPENDED'
                              ? 'Suspendue'
                              : 'Archivée'
                        }
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-1.5 text-sm text-muted">
                    <p>
                      Votre rôle :{' '}
                      <span className="font-medium text-foreground">
                        {ORG_ROLE_LABELS[membership.role]}
                      </span>
                    </p>
                    <p>Client depuis le {formatDate(membership.organization.created_at)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ---- Accès rapides ---- */}
        <section aria-labelledby="titre-acces" className="mb-10">
          <h2 id="titre-acces" className="mb-4 text-lg font-semibold">
            Votre site
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="transition-colors hover:border-primary">
              <Link
                to="/dashboard/site"
                className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <CardContent className="pt-6">
                  <MonitorSmartphone className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 font-medium">Mon site</p>
                  <p className="mt-1 text-sm text-muted">
                    Adresse, hébergement, dernier déploiement.
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="transition-colors hover:border-primary">
              <Link
                to="/dashboard/domaine"
                className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <CardContent className="pt-6">
                  <Globe className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 font-medium">Domaine</p>
                  <p className="mt-1 text-sm text-muted">
                    Nom de domaine, DNS et certificat.
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </section>

        {/* ---- Ce qui n'existe pas encore ---- */}
        <section aria-labelledby="titre-suite">
          <h2 id="titre-suite" className="mb-4 text-lg font-semibold">
            La suite de votre espace
          </h2>

          <Alert tone="info" title="Abonnement et facturation à venir">
            <p>
              Le suivi de votre abonnement, vos factures et vos demandes de modification
              arrivent prochainement. Ces sections ne sont pas affichées tant qu’elles ne
              sont pas réellement alimentées : mieux vaut une page honnête qu’un tableau
              de bord qui montre des informations invérifiables.
            </p>
            <p className="mt-2">
              En attendant, écrivez-nous pour toute demande concernant votre site.
            </p>
          </Alert>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/contact">Contacter HBG Labs</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/parametres">
                <ShieldCheck aria-hidden="true" />
                Sécurité du compte
              </Link>
            </Button>
          </div>
        </section>
      </Container>
    </>
  );
}
