import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useMyDomains } from '@/features/client/useClientResources';
import type { ClientDomain } from '@/services/client.service';
import { isVerified } from '@/types/domain';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge, VerifiedStatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Mon domaine (§17).
 *
 * §17 est explicite : « Ne jamais afficher de fausses informations. Si
 * l'intégration Vercel/Cloudflare n'est pas encore disponible, afficher
 * clairement "Vérification non configurée" et non "actif". »
 *
 * Les trois voyants prévus par §17 passent donc tous par
 * `VerifiedStatusBadge`, qui refuse d'afficher un état affirmatif sans source.
 * Les contraintes CHECK de la migration 06 rendent d'ailleurs impossible
 * l'enregistrement d'un statut affirmatif tant que `verification_source` vaut
 * 'NONE'.
 *
 * `auto_renew` distingue trois états et non deux : NULL signifie « réglage
 * inconnu », ce qui n'est pas « renouvellement désactivé ».
 */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function DomainCard({ domain }: { domain: ClientDomain }) {
  const verified = isVerified(domain.verification_source);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle as="h2">{domain.domain}</CardTitle>
          {domain.is_primary && (
            <StatusBadge tone="info" label="Domaine principal" withDot={false} />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <dl>
          <DetailRow label="État du domaine">
            <VerifiedStatusBadge
              source={domain.verification_source}
              checkedAt={domain.checked_at}
              label="Actif"
              tone="success"
            />
          </DetailRow>

          <DetailRow label="Configuration DNS">
            <VerifiedStatusBadge
              source={domain.verification_source}
              checkedAt={domain.checked_at}
              label="Configurée"
              tone="success"
            />
          </DetailRow>

          <DetailRow label="Certificat SSL">
            <VerifiedStatusBadge
              source={domain.verification_source}
              checkedAt={domain.checked_at}
              label="Actif"
              tone="success"
            />
          </DetailRow>

          <DetailRow label="Bureau d’enregistrement">
            {domain.registrar ?? <span className="text-muted">Non renseigné</span>}
          </DetailRow>

          <DetailRow label="Expiration">
            {domain.expires_at ? (
              formatDate(domain.expires_at)
            ) : (
              <span className="text-muted">Date non renseignée</span>
            )}
          </DetailRow>

          <DetailRow label="Renouvellement automatique">
            {/* Trois états, pas deux : NULL veut dire « inconnu », ce qui
                diffère de « désactivé ». Les confondre afficherait « non » pour
                un domaine dont on ignore simplement le réglage. */}
            {domain.auto_renew === null ? (
              <span className="text-muted">Réglage inconnu</span>
            ) : domain.auto_renew ? (
              'Activé'
            ) : (
              'Désactivé'
            )}
          </DetailRow>
        </dl>

        {!verified && (
          <Alert tone="info" title="Vérification automatique non configurée" className="mt-6">
            <p>
              Nous n’avons pas encore de remontée automatique de l’état DNS et du
              certificat pour ce domaine. Plutôt que d’afficher trois voyants verts que
              rien ne confirme, nous préférons vous dire que la vérification n’est pas
              en place.
            </p>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function MonDomainePage() {
  const { data, isPending, isError, error, refetch } = useMyDomains();

  return (
    <>
      <Seo
        title="Mon domaine"
        description="Vos noms de domaine."
        path="/dashboard/domaine"
        noIndex
      />

      <Container className="py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Mon domaine
          </h1>
          <p className="mt-2 text-muted">
            Vos noms de domaine et leur configuration technique.
          </p>
        </header>

        {isPending && <LoadingState label="Chargement de vos domaines…" />}

        {isError && (
          <ErrorState
            title="Vos domaines n’ont pas pu être chargés"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={Globe}
            title="Aucun domaine rattaché à votre compte"
            description="Votre nom de domaine apparaîtra ici dès que HBG Labs l’aura enregistré pour votre entreprise."
            action={
              <Button asChild variant="outline">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="space-y-6">
            {data.map((domain) => (
              <DomainCard key={domain.id} domain={domain} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
