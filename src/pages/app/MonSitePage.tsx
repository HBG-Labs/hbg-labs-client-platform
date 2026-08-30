import { Link } from 'react-router-dom';
import { ExternalLink, MonitorSmartphone } from 'lucide-react';
import { useMyWebsites } from '@/features/client/useClientResources';
import type { ClientWebsite } from '@/services/client.service';
import { WEBSITE_STATUS_LABELS, isVerified, type WebsiteStatus } from '@/types/domain';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge, VerifiedStatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Mon site (§16).
 *
 * L'écran cible du §16 affiche un point vert « En ligne ». Il ne s'affiche ici
 * que si `verification_source` vaut autre chose que 'NONE', c'est-à-dire si un
 * état a réellement été constaté. Sinon, le voyant reste gris et porte
 * « Vérification non configurée ».
 *
 * Le statut du site, lui, est déclaré par HBG Labs. Il est présenté comme tel :
 * les deux informations ne sont pas de même nature et ne se lisent pas de la
 * même façon.
 *
 * La disponibilité (`uptime`) reste absente tant qu'aucune sonde ne la mesure.
 * §16 la qualifie de « si disponible » : afficher 100 % par défaut serait une
 * information inventée.
 */

const STATUS_TONES: Record<WebsiteStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  IN_DEVELOPMENT: 'info',
  STAGING: 'info',
  ONLINE: 'success',
  SUSPENDED: 'warning',
  ARCHIVED: 'neutral',
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function WebsiteCard({ website }: { website: ClientWebsite }) {
  const verified = isVerified(website.verification_source);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle as="h2">{website.name}</CardTitle>
            {website.organization && (
              <p className="mt-1 text-sm text-muted">{website.organization.name}</p>
            )}
          </div>

          <StatusBadge
            tone={STATUS_TONES[website.status]}
            label={WEBSITE_STATUS_LABELS[website.status]}
          />
        </div>
      </CardHeader>

      <CardContent>
        <dl>
          <DetailRow label="Adresse">
            {website.production_url ? (
              <a
                href={website.production_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                {website.production_url.replace(/^https:\/\//, '')}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-muted">Pas encore attribuée</span>
            )}
          </DetailRow>

          <DetailRow label="Hébergement">{website.hosting_provider}</DetailRow>

          <DetailRow label="Certificat SSL">
            <VerifiedStatusBadge
              source={website.verification_source}
              checkedAt={website.checked_at}
              label="Actif"
              tone="success"
            />
          </DetailRow>

          <DetailRow label="Dernier déploiement">
            {website.last_deployed_at ? (
              formatDate(website.last_deployed_at)
            ) : (
              <span className="text-muted">Aucun déploiement enregistré</span>
            )}
          </DetailRow>

          {/* Section affichée uniquement si une mesure existe. §16 la qualifie
              de « si disponible » : un 100 % par défaut serait inventé. */}
          {website.uptime_percentage !== null && website.uptime_window_days !== null && (
            <DetailRow label="Disponibilité">
              {website.uptime_percentage.toFixed(2).replace('.', ',')} % sur{' '}
              {website.uptime_window_days} jours
            </DetailRow>
          )}
        </dl>

        {!verified && (
          <Alert tone="info" title="Suivi automatique non configuré" className="mt-6">
            <p>
              L’état technique de ce site n’est pas encore remonté automatiquement.
              Nous préférons l’indiquer plutôt qu’afficher un voyant que rien ne
              confirme. Le suivi en temps réel arrivera avec l’intégration de notre
              hébergeur.
            </p>
          </Alert>
        )}

        {website.production_url && (
          <div className="mt-6">
            <Button asChild variant="outline">
              <a href={website.production_url} target="_blank" rel="noreferrer noopener">
                Visiter le site
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MonSitePage() {
  const { data, isPending, isError, error, refetch } = useMyWebsites();

  return (
    <>
      <Seo title="Mon site" description="Votre site web." path="/dashboard/site" noIndex />

      <Container className="py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mon site</h1>
          <p className="mt-2 text-muted">
            L’état de votre site, tel qu’il est enregistré chez HBG Labs.
          </p>
        </header>

        {isPending && <LoadingState label="Chargement de votre site…" />}

        {isError && (
          <ErrorState
            title="Votre site n’a pas pu être chargé"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={MonitorSmartphone}
            title="Aucun site rattaché à votre compte"
            description="Votre site apparaîtra ici dès que HBG Labs l’aura créé et rattaché à votre entreprise."
            action={
              <Button asChild variant="outline">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="space-y-6">
            {data.map((website) => (
              <WebsiteCard key={website.id} website={website} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
