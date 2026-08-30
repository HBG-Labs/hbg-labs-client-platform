import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Plus } from 'lucide-react';
import {
  domainSchema,
  type DomainFormInput,
  type DomainFormValues,
} from '@/schemas/admin.schema';
import {
  useCreateDomain,
  useDomains,
  useOrganizations,
  useWebsites,
} from '@/features/admin/useAdmin';
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
 * Domaines clients (§32).
 *
 * Les trois voyants du §17 (domaine, DNS, SSL) restent tous à « Vérification
 * non configurée » tant qu'aucune intégration Cloudflare ou Vercel ne les
 * constate. Les contraintes CHECK de la migration 06 rendent d'ailleurs
 * impossible l'enregistrement d'un statut affirmatif sans source.
 */

function DomainDialog() {
  const [open, setOpen] = useState(false);
  const organizations = useOrganizations();
  const websites = useWebsites();
  const mutation = useCreateDomain();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DomainFormInput, unknown, DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: { is_primary: false },
  });

  const selectedOrganization = watch('organization_id');

  // Seuls les sites du client choisi sont proposés : le trigger
  // `guard_domain_website_tenant` refuse tout rattachement inter-tenant, autant
  // ne pas laisser l'erreur se produire.
  const eligibleWebsites = (websites.data ?? []).filter(
    (website) => website.organization_id === selectedOrganization,
  );

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    reset({ is_primary: false });
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
        <Button>
          <Plus aria-hidden="true" />
          Nouveau domaine
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Nouveau domaine"
        description="Le domaine est unique sur la plateforme. Les statuts DNS et SSL resteront à vérifier tant qu’aucune intégration ne les constate."
      >
        {mutation.isError && (
          <Alert tone="danger" title="Enregistrement impossible" className="mb-6">
            <p>{mutation.error.message}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Client" error={errors.organization_id?.message} required>
            <Select {...register('organization_id')}>
              <option value="">Sélectionnez un client</option>
              {(organizations.data ?? []).map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Nom de domaine"
            error={errors.domain?.message}
            hint="Sans https ni barre oblique. Exemple : boulangerie-martin.fr"
            required
          >
            <Input {...register('domain')} placeholder="boulangerie-martin.fr" />
          </Field>

          <Field
            label="Site desservi"
            error={errors.website_id?.message}
            hint={
              selectedOrganization
                ? 'Seuls les sites de ce client sont proposés.'
                : 'Sélectionnez d’abord un client.'
            }
          >
            <Select {...register('website_id')} disabled={!selectedOrganization}>
              <option value="">Aucun site pour le moment</option>
              {eligibleWebsites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Bureau d’enregistrement" error={errors.registrar?.message}>
            <Input {...register('registrar')} placeholder="OVH, Gandi, Cloudflare…" />
          </Field>

          <div className="flex items-start gap-3">
            <input
              {...register('is_primary')}
              id="is-primary"
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <label htmlFor="is-primary" className="text-sm leading-relaxed text-muted">
              Domaine principal du site. Un domaine principal doit désigner un site.
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Enregistrement">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DomainsPage() {
  const { data, isPending, isError, error, refetch } = useDomains();

  return (
    <>
      <Seo title="Domaines" description="Domaines clients." path="/admin/domaines" noIndex />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Domaines"
          description="Les noms de domaine gérés pour vos clients."
          action={<DomainDialog />}
        />

        <Alert tone="info" title="Aucune vérification automatique à ce jour" className="mb-6">
          <p>
            Les états DNS et SSL ne sont pas encore constatés par une intégration.
            L’interface affiche « Vérification non configurée » plutôt qu’un voyant vert
            invérifiable, et la base refuse d’enregistrer un statut affirmatif sans
            source.
          </p>
        </Alert>

        {isPending && <LoadingState label="Chargement des domaines…" />}

        {isError && (
          <ErrorState
            title="La liste n’a pas pu être chargée"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={Globe}
            title="Aucun domaine enregistré"
            description="Ajoutez un domaine et rattachez-le au site du client concerné."
          />
        )}

        {data && data.length > 0 && (
          <DataTable caption="Liste des domaines">
            <DataTableHead>
              <DataTableHeader>Domaine</DataTableHeader>
              <DataTableHeader>Client</DataTableHeader>
              <DataTableHeader>DNS</DataTableHeader>
              <DataTableHeader>SSL</DataTableHeader>
              <DataTableHeader>Expiration</DataTableHeader>
              <DataTableHeader>Ajouté le</DataTableHeader>
            </DataTableHead>

            <DataTableBody>
              {data.map((domain) => (
                <DataTableRow key={domain.id}>
                  <DataTableCell label="Domaine">
                    <span className="font-medium">{domain.domain}</span>
                    {domain.is_primary && (
                      <span className="ml-2">
                        <StatusBadge tone="info" label="Principal" withDot={false} />
                      </span>
                    )}
                    {domain.registrar && (
                      <span className="block text-xs text-muted">{domain.registrar}</span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Client">
                    {domain.organization?.name ?? (
                      <span className="text-muted">Non rattaché</span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="DNS">
                    <VerifiedStatusBadge
                      source={domain.verification_source}
                      checkedAt={domain.checked_at}
                      label="Configuré"
                      tone="success"
                    />
                  </DataTableCell>

                  <DataTableCell label="SSL">
                    <VerifiedStatusBadge
                      source={domain.verification_source}
                      checkedAt={domain.checked_at}
                      label="Actif"
                      tone="success"
                    />
                  </DataTableCell>

                  <DataTableCell label="Expiration">
                    {domain.expires_at ? (
                      formatDate(domain.expires_at)
                    ) : (
                      <span className="text-muted">Inconnue</span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Ajouté le">
                    {formatDate(domain.created_at)}
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
