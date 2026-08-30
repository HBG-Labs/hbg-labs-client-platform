import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import {
  memberSchema,
  organizationSchema,
  type MemberFormInput,
  type MemberFormValues,
  type OrganizationFormInput,
  type OrganizationFormValues,
} from '@/schemas/admin.schema';
import {
  useAddOrganizationMember,
  useOrganization,
  useOrganizationMembers,
  useRemoveMember,
  useUpdateMemberRole,
  useUpdateOrganization,
} from '@/features/admin/useAdmin';
import { ORG_ROLE_LABELS, type OrgRole } from '@/types/domain';
import { formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { Container } from '@/components/ui/Layout';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Fiche client (§28).
 *
 * Deux blocs : les informations de l'organisation, et ses membres.
 *
 * Le rattachement d'un membre suppose que la personne ait déjà créé son compte.
 * L'interface le dit clairement quand l'adresse est inconnue, plutôt que
 * d'échouer sans expliquer.
 */

const ROLES: OrgRole[] = ['OWNER', 'MANAGER', 'MEMBER'];

function OrganizationForm({ organizationId }: { organizationId: string }) {
  const { data } = useOrganization(organizationId);
  const mutation = useUpdateOrganization(organizationId);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormInput, unknown, OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    // Les valeurs viennent de la base : le formulaire soumet ensuite l'objet
    // complet, un champ vidé effaçant bien la valeur enregistrée.
    //
    // La clé `values` n'est ajoutée qu'une fois la donnée chargée : lui passer
    // `undefined` est refusé sous `exactOptionalPropertyTypes`, et reviendrait
    // de toute façon à réinitialiser le formulaire à chaque rendu.
    ...(data
      ? {
          values: {
            name: data.name,
            slug: data.slug,
            legal_name: data.legal_name ?? '',
            siret: data.siret ?? '',
            billing_email: data.billing_email ?? '',
            phone: data.phone ?? '',
            address_line1: data.address_line1 ?? '',
            postal_code: data.postal_code ?? '',
            city: data.city ?? '',
          },
        }
      : {}),
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    await mutation.mutateAsync({ input: values });
    setSaved(true);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Informations</CardTitle>
        <CardDescription>
          Ces informations alimentent la facturation et la fiche « Mon entreprise » du
          client.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {saved && (
          <Alert tone="success" title="Modifications enregistrées" className="mb-6" />
        )}

        {mutation.isError && (
          <Alert tone="danger" title="Enregistrement impossible" className="mb-6">
            <p>{mutation.error.message}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom du client" error={errors.name?.message} required>
              <Input {...register('name')} />
            </Field>

            <Field label="Identifiant" error={errors.slug?.message} required>
              <Input {...register('slug')} />
            </Field>
          </div>

          <Field label="Dénomination sociale" error={errors.legal_name?.message}>
            <Input {...register('legal_name')} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="SIRET" error={errors.siret?.message}>
              <Input {...register('siret')} inputMode="numeric" />
            </Field>

            <Field label="Téléphone" error={errors.phone?.message}>
              <Input {...register('phone')} type="tel" />
            </Field>
          </div>

          <Field label="Adresse de facturation" error={errors.billing_email?.message}>
            <Input {...register('billing_email')} type="email" />
          </Field>

          <Field label="Adresse" error={errors.address_line1?.message}>
            <Input {...register('address_line1')} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Code postal" error={errors.postal_code?.message}>
              <Input {...register('postal_code')} />
            </Field>

            <Field label="Ville" error={errors.city?.message}>
              <Input {...register('city')} />
            </Field>
          </div>

          <div className="border-t border-border pt-5">
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Enregistrement">
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MembersCard({ organizationId }: { organizationId: string }) {
  const members = useOrganizationMembers(organizationId);
  const addMember = useAddOrganizationMember(organizationId);
  const updateRole = useUpdateMemberRole(organizationId);
  const removeMember = useRemoveMember(organizationId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormInput, unknown, MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { role: 'MEMBER' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await addMember.mutateAsync(values);
    reset({ email: '', role: 'MEMBER' });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Utilisateurs rattachés</CardTitle>
        <CardDescription>
          La personne doit avoir créé son compte au préalable. Vous la rattachez ensuite
          par son adresse électronique.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {members.isPending && <LoadingState label="Chargement des membres…" />}

        {members.isError && (
          <ErrorState
            title="Les membres n’ont pas pu être chargés"
            error={members.error}
            onRetry={() => void members.refetch()}
          />
        )}

        {members.data && members.data.length === 0 && (
          <EmptyState
            icon={Users}
            title="Aucun utilisateur rattaché"
            description="Ce client ne peut pas encore accéder à son espace."
          />
        )}

        {members.data && members.data.length > 0 && (
          <ul className="divide-y divide-border">
            {members.data.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.profile?.full_name || member.profile?.email}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {member.profile?.email} · rattaché le {formatDate(member.joined_at)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <label className="sr-only" htmlFor={`role-${member.id}`}>
                    Rôle de {member.profile?.email}
                  </label>
                  <select
                    id={`role-${member.id}`}
                    value={member.role}
                    onChange={(event) =>
                      updateRole.mutate({
                        memberId: member.id,
                        role: event.target.value as OrgRole,
                      })
                    }
                    className="h-11 rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ORG_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember.mutate(member.id)}
                    isLoading={removeMember.isPending}
                    loadingLabel="Retrait en cours"
                  >
                    Retirer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Les gardes de la base remontent ici : le trigger `guard_last_org_owner`
            refuse de retirer le dernier dirigeant, et le service traduit son
            message en français. */}
        {updateRole.isError && (
          <Alert tone="warning" title="Modification refusée">
            <p>{updateRole.error.message}</p>
          </Alert>
        )}

        {removeMember.isError && (
          <Alert tone="warning" title="Retrait refusé">
            <p>{removeMember.error.message}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="border-t border-border pt-6">
          <p className="mb-4 text-sm font-medium">Rattacher un utilisateur</p>

          {addMember.isError && (
            <Alert tone="warning" title="Rattachement impossible" className="mb-4">
              <p>{addMember.error.message}</p>
            </Alert>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field label="Adresse électronique" error={errors.email?.message} className="flex-1">
              <Input {...register('email')} type="email" placeholder="client@exemple.fr" />
            </Field>

            <Field label="Rôle" error={errors.role?.message} className="sm:w-44">
              <Select {...register('role')}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ORG_ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </Field>

            <Button type="submit" isLoading={isSubmitting} loadingLabel="Rattachement">
              <UserPlus aria-hidden="true" />
              Rattacher
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const organizationId = id ?? '';
  const { data, isPending, isError, error, refetch } = useOrganization(organizationId);

  return (
    <>
      <Seo
        title={data?.name ?? 'Client'}
        description="Fiche client."
        path={`/admin/clients/${organizationId}`}
        noIndex
      />

      <Container className="py-8 sm:py-10">
        <Link
          to="/admin/clients"
          className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tous les clients
        </Link>

        {isPending && <LoadingState label="Chargement du client…" />}

        {isError && (
          <ErrorState
            title="Ce client n’a pas pu être chargé"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {!isPending && !isError && !data && (
          <EmptyState
            title="Client introuvable"
            description="Cette organisation n’existe pas, ou elle ne vous est pas accessible."
          />
        )}

        {data && (
          <>
            <header className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
              <p className="mt-1.5 text-sm text-muted">
                Client depuis le {formatDate(data.created_at)}
              </p>
            </header>

            <div className="space-y-6">
              <OrganizationForm organizationId={organizationId} />
              <MembersCard organizationId={organizationId} />
            </div>
          </>
        )}
      </Container>
    </>
  );
}
