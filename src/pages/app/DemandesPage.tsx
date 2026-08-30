import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquarePlus, Inbox } from 'lucide-react';
import {
  CHANGE_REQUEST_EXAMPLES,
  TICKET_CATEGORIES,
  createTicketSchema,
  type CreateTicketFormInput,
  type CreateTicketFormValues,
} from '@/schemas/ticket.schema';
import { useCreateTicket, useTickets } from '@/features/tickets/useTickets';
import { TICKET_STATUS_TONES, TICKET_TYPE_LABELS } from '@/features/tickets/ticket-display';
import { useMyOrganizations } from '@/features/auth/useProfile';
import { useMyWebsites } from '@/features/client/useClientResources';
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/types/domain';
import { formatDateTime } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Mes demandes (§24, §25).
 *
 * §25 en fait la fonctionnalité principale de l'espace client : « demander une
 * modification du site ». Le formulaire s'ouvre donc sur ce type de demande, et
 * propose les exemples du §25 en aide à la saisie. Une personne qui ignore ce
 * qu'elle a le droit de demander ne demande rien.
 */

function CreateTicketDialog() {
  const [open, setOpen] = useState(false);
  const organizations = useMyOrganizations();
  const websites = useMyWebsites();
  const mutation = useCreateTicket();

  const memberships = organizations.data ?? [];
  // Une seule entreprise dans l'immense majorité des cas : la présélectionner
  // évite un choix qui n'en est pas un.
  const soleOrganization = memberships.length === 1 ? memberships[0] : undefined;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormInput, unknown, CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      type: 'CHANGE_REQUEST',
      category: 'SITE',
      ...(soleOrganization ? { organization_id: soleOrganization.organization.id } : {}),
    },
  });

  const type = watch('type');

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    reset({
      type: 'CHANGE_REQUEST',
      category: 'SITE',
      ...(soleOrganization ? { organization_id: soleOrganization.organization.id } : {}),
    });
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
        <Button disabled={memberships.length === 0}>
          <MessageSquarePlus aria-hidden="true" />
          Nouvelle demande
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Nouvelle demande"
        description="Décrivez ce dont vous avez besoin. Nous vous répondons sous 24 heures ouvrées."
      >
        {mutation.isError && (
          <Alert tone="danger" title="Envoi impossible" className="mb-6">
            <p>{mutation.error.message}</p>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {memberships.length > 1 && (
            <Field label="Entreprise" error={errors.organization_id?.message} required>
              <Select {...register('organization_id')}>
                <option value="">Sélectionnez</option>
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.organization.id}>
                    {membership.organization.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Type de demande" error={errors.type?.message} required>
            <Select {...register('type')}>
              <option value="CHANGE_REQUEST">Modification de mon site</option>
              <option value="SUPPORT">Problème ou question</option>
            </Select>
          </Field>

          {type === 'CHANGE_REQUEST' && (
            <div className="rounded-md border border-border bg-surface-muted p-4">
              <p className="text-sm font-medium">Exemples de modifications</p>
              <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
                {CHANGE_REQUEST_EXAMPLES.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          <Field label="Catégorie" error={errors.category?.message} required>
            <Select {...register('category')}>
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {TICKET_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </Field>

          {(websites.data ?? []).length > 0 && (
            <Field
              label="Site concerné"
              error={errors.website_id?.message}
              hint="Facultatif. Utile si votre demande porte sur un site précis."
            >
              <Select {...register('website_id')}>
                <option value="">Aucun site en particulier</option>
                {(websites.data ?? []).map((website) => (
                  <option key={website.id} value={website.id}>
                    {website.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Objet" error={errors.subject?.message} required>
            <Input {...register('subject')} placeholder="Modifier les horaires du samedi" />
          </Field>

          <Field
            label="Votre demande"
            error={errors.description?.message}
            hint="Plus vous êtes précis, plus notre réponse sera rapide."
            required
          >
            <Textarea
              {...register('description')}
              rows={6}
              placeholder="Merci de remplacer les horaires du samedi par 9h-13h sur la page d’accueil et sur la page Contact."
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Envoi en cours">
              Envoyer ma demande
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DemandesPage() {
  const { data, isPending, isError, error, refetch } = useTickets();
  const organizations = useMyOrganizations();

  const hasOrganization = (organizations.data ?? []).length > 0;

  return (
    <>
      <Seo
        title="Mes demandes"
        description="Vos demandes de modification et d’assistance."
        path="/dashboard/demandes"
        noIndex
      />

      <Container className="py-10 sm:py-14">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Mes demandes
            </h1>
            <p className="mt-2 text-muted">
              Modifications de votre site, questions et incidents.
            </p>
          </div>

          {hasOrganization && <CreateTicketDialog />}
        </header>

        {!hasOrganization && !organizations.isPending && (
          <Alert tone="info" title="Aucune entreprise rattachée à votre compte">
            <p>
              Les demandes se rattachent à une entreprise. HBG Labs effectue ce
              rattachement lors de la mise en place de votre projet.
            </p>
          </Alert>
        )}

        {isPending && <LoadingState label="Chargement de vos demandes…" />}

        {isError && (
          <ErrorState
            title="Vos demandes n’ont pas pu être chargées"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && data.length === 0 && hasOrganization && (
          <EmptyState
            icon={Inbox}
            title="Aucune demande pour le moment"
            description="Une modification à apporter à votre site, une question sur votre hébergement ? Ouvrez une demande, nous répondons sous 24 heures ouvrées."
            action={<CreateTicketDialog />}
          />
        )}

        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((ticket) => (
              <li key={ticket.id}>
                <Card className="transition-colors hover:border-primary">
                  <Link
                    to={`/dashboard/demandes/${ticket.id}`}
                    className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="mt-1 text-sm text-muted">
                            {ticket.reference} · {TICKET_TYPE_LABELS[ticket.type]} ·{' '}
                            {TICKET_CATEGORY_LABELS[ticket.category]}
                          </p>
                        </div>

                        <StatusBadge
                          tone={TICKET_STATUS_TONES[ticket.status]}
                          label={TICKET_STATUS_LABELS[ticket.status]}
                        />
                      </div>

                      <p className="mt-3 text-xs text-muted">
                        Dernière activité le {formatDateTime(ticket.last_activity_at)}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
