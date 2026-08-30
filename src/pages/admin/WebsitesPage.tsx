import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, MonitorSmartphone, Plus } from 'lucide-react';
import {
  slugify,
  websiteSchema,
  WEBSITE_STATUSES,
  type WebsiteFormInput,
  type WebsiteFormValues,
} from '@/schemas/admin.schema';
import {
  useCreateWebsite,
  useOrganizations,
  useUpdateWebsite,
  useWebsites,
} from '@/features/admin/useAdmin';
import type { AdminWebsite } from '@/services/admin.service';
import { WEBSITE_STATUS_LABELS, type WebsiteStatus } from '@/types/domain';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { Container } from '@/components/ui/Layout';
import { StatusBadge, VerifiedStatusBadge } from '@/components/ui/StatusBadge';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/components/ui/Table';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Sites clients (§29).
 *
 * Le statut affiché est celui que HBG Labs a saisi. Le voyant SSL, lui, passe
 * par `VerifiedStatusBadge` : il dépend d'une vérification externe qui n'existe
 * pas encore, et affiche donc « Vérification non configurée » (§17).
 *
 * La distinction est volontaire et visible dans le tableau : un statut déclaré
 * et un statut constaté ne se présentent pas de la même façon.
 */

const STATUS_TONES: Record<WebsiteStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  IN_DEVELOPMENT: 'info',
  STAGING: 'info',
  ONLINE: 'success',
  SUSPENDED: 'warning',
  ARCHIVED: 'neutral',
};

function WebsiteDialog({ website }: { website?: AdminWebsite }) {
  const [open, setOpen] = useState(false);
  const organizations = useOrganizations();
  const createWebsite = useCreateWebsite();
  const updateWebsite = useUpdateWebsite();
  const mutation = website ? updateWebsite : createWebsite;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WebsiteFormInput, unknown, WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    values: website
      ? {
          organization_id: website.organization_id,
          name: website.name,
          slug: website.slug,
          status: website.status,
          production_url: website.production_url ?? '',
          repository_url: website.repository_url ?? '',
          hosting_provider: website.hosting_provider,
        }
      : { status: 'DRAFT', organization_id: '', name: '', slug: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (website) {
      await updateWebsite.mutateAsync({ id: website.id, input: values });
    } else {
      await createWebsite.mutateAsync(values);
      reset();
    }
    setOpen(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) mutation.reset();
      }}
    >
      <DialogTrigger asChild>
        {website ? (
          <Button variant="ghost" size="sm">
            Modifier
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden="true" />
            Nouveau site
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        title={website ? 'Modifier le site' : 'Nouveau site'}
        description="Le statut est déclaratif. La vérification automatique de l’état viendra avec l’intégration Vercel."
      >
        {mutation.isError && (
          <Alert tone="danger" title="Enregistrement impossible" className="mb-6">
            <p>{mutation.error.message}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Client" error={errors.organization_id?.message} required>
            <Select {...register('organization_id')} disabled={Boolean(website)}>
              <option value="">Sélectionnez un client</option>
              {(organizations.data ?? []).map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nom du site" error={errors.name?.message} required>
            <Input
              {...register('name')}
              placeholder="Site vitrine Boulangerie Martin"
              onBlur={(event) => {
                const proposed = slugify(event.target.value);
                // `getValues` plutot que `watch` : dans un gestionnaire
                // d'evenement on lit la valeur courante, on ne s'abonne pas
                // a ses changements.
                if (proposed && !getValues('slug')) setValue('slug', proposed);
              }}
            />
          </Field>

          <Field label="Identifiant" error={errors.slug?.message} required>
            <Input {...register('slug')} placeholder="site-vitrine" />
          </Field>

          <Field label="Statut" error={errors.status?.message} required>
            <Select {...register('status')}>
              {WEBSITE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {WEBSITE_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Adresse de production"
            error={errors.production_url?.message}
            hint="HTTPS obligatoire."
          >
            <Input {...register('production_url')} placeholder="https://boulangerie-martin.fr" />
          </Field>

          <Field label="Dépôt de code" error={errors.repository_url?.message}>
            <Input
              {...register('repository_url')}
              placeholder="https://github.com/HBG-Labs/…"
            />
          </Field>

          <Field label="Hébergeur" error={errors.hosting_provider?.message}>
            <Input {...register('hosting_provider')} placeholder="Vercel" />
          </Field>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Enregistrement">
              {website ? 'Enregistrer' : 'Créer le site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WebsitesPage() {
  const { data, isPending, isError, error, refetch } = useWebsites();

  return (
    <>
      <Seo title="Sites" description="Sites clients." path="/admin/sites" noIndex />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Sites"
          description="Les sites que HBG Labs conçoit et héberge."
          action={<WebsiteDialog />}
        />

        {isPending && <LoadingState label="Chargement des sites…" />}

        {isError && (
          <ErrorState
            title="La liste n’a pas pu être chargée"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={MonitorSmartphone}
            title="Aucun site enregistré"
            description="Créez un site et rattachez-le à un client pour qu’il apparaisse dans son espace."
          />
        )}

        {data && data.length > 0 && (
          <DataTable caption="Liste des sites clients">
            <DataTableHead>
              <DataTableHeader>Site</DataTableHeader>
              <DataTableHeader>Client</DataTableHeader>
              <DataTableHeader>Statut déclaré</DataTableHeader>
              <DataTableHeader>Certificat SSL</DataTableHeader>
              <DataTableHeader>Créé le</DataTableHeader>
              <DataTableHeader align="right">Action</DataTableHeader>
            </DataTableHead>

            <DataTableBody>
              {data.map((website) => (
                <DataTableRow key={website.id}>
                  <DataTableCell label="Site">
                    <span className="font-medium">{website.name}</span>
                    {website.production_url && (
                      <a
                        href={website.production_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {website.production_url.replace(/^https:\/\//, '')}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Client">
                    {website.organization?.name ?? (
                      <span className="text-muted">Non rattaché</span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Statut déclaré">
                    <StatusBadge
                      tone={STATUS_TONES[website.status]}
                      label={WEBSITE_STATUS_LABELS[website.status]}
                    />
                  </DataTableCell>

                  <DataTableCell label="Certificat SSL">
                    {/* Passe par le composant vérifié : tant qu'aucune
                        intégration ne constate l'état, il affiche
                        « Vérification non configurée » (§17). */}
                    <VerifiedStatusBadge
                      source={website.verification_source}
                      checkedAt={website.checked_at}
                      label="Actif"
                      tone="success"
                    />
                  </DataTableCell>

                  <DataTableCell label="Créé le">
                    {formatDate(website.created_at)}
                  </DataTableCell>

                  <DataTableCell label="Action" align="right">
                    <WebsiteDialog website={website} />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Container>
    </>
  );
}
