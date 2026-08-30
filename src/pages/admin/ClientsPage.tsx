import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Plus } from 'lucide-react';
import {
  organizationSchema,
  slugify,
  type OrganizationFormInput,
  type OrganizationFormValues,
} from '@/schemas/admin.schema';
import { useCreateOrganization, useOrganizations } from '@/features/admin/useAdmin';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/components/ui/Table';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import type { OrganizationStatus } from '@/types/domain';

/**
 * Liste des clients (§28).
 *
 * La création se limite à l'organisation. Le rattachement d'un utilisateur se
 * fait depuis la fiche du client, et suppose que la personne ait déjà créé son
 * compte : fabriquer un utilisateur d'authentification demanderait la clé
 * `service_role`, qui n'a rien à faire dans un navigateur (§36).
 */

const STATUS_TONES: Record<OrganizationStatus, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  ARCHIVED: 'neutral',
};

const STATUS_LABELS: Record<OrganizationStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  ARCHIVED: 'Archivé',
};

function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateOrganization();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormInput, unknown, OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
  });

  const name = watch('name');

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    reset();
    setOpen(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          mutation.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          Nouveau client
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Nouveau client"
        description="Créez l’organisation. Vous pourrez y rattacher des utilisateurs depuis sa fiche."
      >
        {mutation.isError && (
          <Alert tone="danger" title="Création impossible" className="mb-6">
            <p>{mutation.error.message}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Nom du client" error={errors.name?.message} required>
            <Input
              {...register('name')}
              autoFocus
              placeholder="Boulangerie Martin"
              // L'identifiant est proposé depuis le nom, puis modifiable :
              // deux clients peuvent porter des noms proches et l'identifiant
              // doit rester unique.
              onBlur={(event) => {
                const proposed = slugify(event.target.value);
                // `getValues` plutot que `watch` : dans un gestionnaire
                // d'evenement on lit la valeur courante, on ne s'abonne pas
                // a ses changements.
                if (proposed && !getValues('slug')) setValue('slug', proposed);
              }}
            />
          </Field>

          <Field
            label="Identifiant"
            error={errors.slug?.message}
            hint="Utilisé dans les adresses. Minuscules, chiffres et tirets."
            required
          >
            <Input {...register('slug')} placeholder={slugify(name ?? '') || 'boulangerie-martin'} />
          </Field>

          <Field label="Dénomination sociale" error={errors.legal_name?.message}>
            <Input {...register('legal_name')} placeholder="SARL Martin" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="SIRET" error={errors.siret?.message}>
              <Input {...register('siret')} inputMode="numeric" placeholder="12345678901234" />
            </Field>

            <Field label="Téléphone" error={errors.phone?.message}>
              <Input {...register('phone')} type="tel" placeholder="0596 00 00 00" />
            </Field>
          </div>

          <Field
            label="Adresse de facturation"
            error={errors.billing_email?.message}
            hint="Destinataire des factures. Peut différer de l’adresse de connexion."
          >
            <Input {...register('billing_email')} type="email" placeholder="compta@exemple.fr" />
          </Field>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Création en cours">
              Créer le client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientsPage() {
  const { data, isPending, isError, error, refetch } = useOrganizations();

  return (
    <>
      <Seo title="Clients" description="Gestion des clients." path="/admin/clients" noIndex />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Clients"
          description="Les organisations clientes de HBG Labs."
          action={<CreateClientDialog />}
        />

        {isPending && <LoadingState label="Chargement des clients…" />}

        {isError && (
          <ErrorState
            title="La liste n’a pas pu être chargée"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Aucun client enregistré"
            description="Créez votre première organisation cliente pour commencer à suivre ses sites et ses demandes."
          />
        )}

        {data && data.length > 0 && (
          <DataTable caption="Liste des clients">
            <DataTableHead>
              <DataTableHeader>Client</DataTableHeader>
              <DataTableHeader>Identifiant</DataTableHeader>
              <DataTableHeader>Facturation</DataTableHeader>
              <DataTableHeader>Statut</DataTableHeader>
              <DataTableHeader>Créé le</DataTableHeader>
            </DataTableHead>

            <DataTableBody>
              {data.map((organization) => (
                <DataTableRow key={organization.id}>
                  <DataTableCell label="Client">
                    <Link
                      to={`/admin/clients/${organization.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {organization.name}
                    </Link>
                    {organization.legal_name && (
                      <span className="block text-xs text-muted">
                        {organization.legal_name}
                      </span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Identifiant">
                    <code className="text-xs text-muted">{organization.slug}</code>
                  </DataTableCell>

                  <DataTableCell label="Facturation">
                    {organization.billing_email ?? (
                      <span className="text-muted">Non renseignée</span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Statut">
                    <StatusBadge
                      tone={STATUS_TONES[organization.status]}
                      label={STATUS_LABELS[organization.status]}
                    />
                  </DataTableCell>

                  <DataTableCell label="Créé le">
                    {formatDate(organization.created_at)}
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
