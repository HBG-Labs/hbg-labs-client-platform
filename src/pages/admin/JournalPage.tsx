import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useAuditActions, useAuditLog } from '@/features/audit/useAudit';
import type { AuditLogEntry } from '@/services/audit.service';
import { formatDateTime } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Journal d'audit (§44).
 *
 * Consultation seule. L'écran n'offre aucune action, et ne le peut pas :
 * `audit_logs` n'a aucune policy d'écriture, pour aucun rôle. Un bouton
 * « supprimer cette entrée » échouerait — et ne devrait de toute façon jamais
 * exister.
 *
 * Les entrées viennent des triggers de la migration 19, écrites dans la
 * transaction du changement qu'elles décrivent.
 */

/** Libellés des verbes journalisés. Un verbe inconnu s'affiche tel quel. */
const ACTION_LABELS: Record<string, string> = {
  USER_SIGNED_IN: 'Connexion',
  PROFILE_UPDATED: 'Profil modifié',
  PLATFORM_ROLE_CHANGED: 'Rôle plateforme modifié',
  PLATFORM_ACCESS_GRANTED: 'Accès administration accordé',
  PLATFORM_ACCESS_REVOKED: 'Accès administration retiré',
  ORGANIZATION_CREATED: 'Client créé',
  ORGANIZATION_UPDATED: 'Client modifié',
  MEMBER_INVITED: 'Utilisateur rattaché',
  MEMBER_ROLE_CHANGED: 'Rôle dans le client modifié',
  MEMBER_REMOVED: 'Utilisateur détaché',
  WEBSITE_CREATED: 'Site créé',
  WEBSITE_UPDATED: 'Site modifié',
  WEBSITE_STATUS_CHANGED: 'Statut du site modifié',
  DOMAIN_CREATED: 'Domaine ajouté',
  DOMAIN_UPDATED: 'Domaine modifié',
  DOMAIN_STATUS_CHANGED: 'Statut du domaine modifié',
  TICKET_CREATED: 'Demande ouverte',
  TICKET_UPDATED: 'Demande modifiée',
  TICKET_STATUS_CHANGED: 'Statut de la demande modifié',
  SUBSCRIPTION_CHANGED: 'Abonnement modifié',
};

/**
 * Les gestes qui ouvrent l'accès aux données de tous les clients. Ils sont
 * signalés visuellement : dans un flot d'entrées, ce sont les seuls qu'on ne
 * doit pas manquer.
 */
const SENSITIVE_ACTIONS = new Set([
  'PLATFORM_ROLE_CHANGED',
  'PLATFORM_ACCESS_GRANTED',
  'PLATFORM_ACCESS_REVOKED',
]);

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** Rend une valeur de `metadata` lisible sans prétendre l'interpréter. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'oui' : 'non';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function MetadataList({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata ?? {});
  if (entries.length === 0) return null;

  return (
    <dl className="mt-3 grid gap-1.5 border-t border-border pt-3 text-sm">
      {entries.map(([key, value]) => {
        // Les modifications sont consignées sous la forme { avant, apres } :
        // la valeur d'arrivée seule ne dirait pas d'où l'on vient.
        const change =
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          'avant' in (value as object) &&
          'apres' in (value as object)
            ? (value as { avant: unknown; apres: unknown })
            : null;

        return (
          <div key={key} className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-mono text-xs text-muted">{key}</dt>
            <dd className="min-w-0">
              {change ? (
                <span>
                  <span className="text-muted line-through">
                    {renderValue(change.avant)}
                  </span>
                  <span aria-hidden="true" className="mx-1.5 text-muted">
                    →
                  </span>
                  <span className="sr-only">devient</span>
                  <span>{renderValue(change.apres)}</span>
                </span>
              ) : (
                renderValue(value)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function EntryCard({ entry }: { entry: AuditLogEntry }) {
  const sensitive = SENSITIVE_ACTIONS.has(entry.action);

  return (
    <Card className={sensitive ? 'border-warning' : undefined}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium">{actionLabel(entry.action)}</p>

            <p className="mt-0.5 text-sm text-muted">
              {/* Une ligne sans auteur n'est pas une anomalie : le webhook
                  Stripe et les tâches de plateforme agissent sans session.
                  Le dire est plus juste que laisser un blanc. */}
              {entry.actor_email ?? 'Système, sans session'}
              {entry.actor_platform_role && ` · ${entry.actor_platform_role}`}
              {entry.organization && ` · ${entry.organization.name}`}
            </p>

            <p className="mt-1 text-xs text-muted">
              {formatDateTime(entry.created_at)}
              {entry.resource_type && ` · ${entry.resource_type}`}
            </p>
          </div>

          {sensitive && (
            <StatusBadge tone="warning" label="Accès plateforme" withDot={false} />
          )}
        </div>

        <MetadataList metadata={entry.metadata} />
      </CardContent>
    </Card>
  );
}

export function JournalPage() {
  const [action, setAction] = useState('');
  const [actorEmail, setActorEmail] = useState('');

  const actions = useAuditActions();

  // Champs construits par présence plutôt qu'avec `undefined` :
  // `exactOptionalPropertyTypes` distingue « absent » de « présent et
  // indéfini », et la clé de cache s'en trouve plus stable.
  const filters = {
    ...(action ? { action } : {}),
    ...(actorEmail ? { actorEmail } : {}),
  };

  const { data, isPending, isError, error, refetch } = useAuditLog(filters);

  return (
    <>
      <Seo
        title="Journal d’audit"
        description="Historique des actions sensibles."
        path="/admin/journal"
        noIndex
      />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Journal d’audit"
          description="Historique des actions sensibles, en ajout seul. Aucune entrée ne peut être modifiée ni supprimée, par personne."
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-64">
            <label
              htmlFor="journal-action"
              className="mb-1.5 block text-sm font-medium"
            >
              Type d’action
            </label>
            <select
              id="journal-action"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="">Toutes</option>
              {(actions.data ?? []).map((value) => (
                <option key={value} value={value}>
                  {actionLabel(value)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-72">
            <label htmlFor="journal-actor" className="mb-1.5 block text-sm font-medium">
              Auteur
            </label>
            <input
              id="journal-actor"
              type="search"
              value={actorEmail}
              onChange={(event) => setActorEmail(event.target.value)}
              placeholder="Adresse électronique"
              className="h-11 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
        </div>

        {isPending && <LoadingState label="Chargement du journal…" />}

        {isError && (
          <ErrorState
            title="Le journal n’a pas pu être chargé"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={ScrollText}
            title={
              action || actorEmail
                ? 'Aucune entrée ne correspond'
                : 'Le journal est vide'
            }
            description={
              action || actorEmail
                ? 'Modifiez les filtres pour élargir la recherche.'
                : 'Les actions sensibles y apparaîtront à mesure qu’elles se produisent.'
            }
          />
        )}

        {data && data.length > 0 && (
          <>
            <div className="space-y-3">
              {data.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>

            {/* La limite est dite, jamais masquée : une liste tronquée
                silencieusement ferait conclure à l'absence d'une action. */}
            {data.length >= 100 && (
              <p className="mt-6 text-center text-sm text-muted">
                Seules les 100 entrées les plus récentes sont affichées. Affinez
                les filtres pour remonter plus loin.
              </p>
            )}
          </>
        )}
      </Container>
    </>
  );
}
