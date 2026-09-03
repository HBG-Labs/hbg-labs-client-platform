import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  BUDGET_RANGES,
  PROJECT_TYPES,
  quoteRequestSchema,
  type QuoteRequestInput,
  type QuoteRequestValues,
} from '@/schemas/lead.schema';
import { useSubmitQuoteRequest } from '@/features/leads/useSubmitLead';
import { LeadRateLimitError } from '@/services/leads.service';
import { site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Container, Section } from '@/components/ui/Layout';
import { PublicPageHero } from '@/components/marketing/PublicPageHero';

/**
 * Demande de devis (§5).
 *
 * Formulaire réellement fonctionnel : il écrit dans `quote_requests` par la
 * policy `quote_requests_insert_anon`, vérifiée par la suite RLS. Aucune
 * simulation d'envoi.
 *
 * Le paramètre `?offre=PRO` préremplit l'offre quand le visiteur arrive depuis
 * une carte de la grille tarifaire. Le code est envoyé au service, qui le
 * convertit en `plan_id` : la table n'accepte pas un code arbitraire.
 */
export function DevisPage() {
  const [searchParams] = useSearchParams();
  const planCode = searchParams.get('offre') ?? undefined;

  const mutation = useSubmitQuoteRequest();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequestInput, unknown, QuoteRequestValues>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: { plan_code: planCode },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  // ---- État de succès ----
  if (mutation.isSuccess) {
    return (
      <>
        <Seo
          title="Demande envoyée"
          description="Votre demande de devis a bien été transmise à HBG Labs."
          path="/devis"
          noIndex
        />

        <Section>
          <Container width="narrow">
            <div className="rounded-lg border border-success/30 bg-success-surface p-8 text-center sm:p-12">
              <CheckCircle2
                className="mx-auto size-10 text-success"
                aria-hidden="true"
              />
              <h1 className="mt-5 text-2xl font-semibold tracking-tight">
                Votre demande est bien arrivée
              </h1>
              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted">
                Nous l’étudions et revenons vers vous sous 24 heures ouvrées avec une
                proposition chiffrée. Vous recevrez notre réponse à l’adresse
                électronique indiquée.
              </p>
              <div className="mt-8">
                <Button variant="outline" onClick={() => mutation.reset()}>
                  Envoyer une autre demande
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const rateLimited = mutation.error instanceof LeadRateLimitError;

  return (
    <>
      <Seo
        title="Demander un devis"
        description="Décrivez votre projet de site web en quelques lignes. HBG Labs vous répond sous 24 heures ouvrées avec une proposition chiffrée, sans engagement."
        path="/devis"
      />

      <PublicPageHero
        eyebrow="Demande de devis"
        title="Votre projet commence par une bonne conversation."
        description="Quelques informations suffisent pour vous proposer un premier périmètre et un chiffrage adapté."
      />

      <Section>
        <Container width="narrow">
          {/* ---- État d'erreur ---- */}
          {mutation.isError && (
            <Alert
              tone={rateLimited ? 'warning' : 'danger'}
              title={rateLimited ? 'Trop de demandes envoyées' : 'L’envoi a échoué'}
              className="mt-8"
            >
              <p>{mutation.error.message}</p>
            </Alert>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nom et prénom" error={errors.full_name?.message} required>
                <Input
                  {...register('full_name')}
                  autoComplete="name"
                  placeholder="Marie Dupont"
                />
              </Field>

              <Field label="Adresse électronique" error={errors.email?.message} required>
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="marie.dupont@exemple.fr"
                />
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Téléphone" error={errors.phone?.message}>
                <Input
                  {...register('phone')}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="0596 00 00 00"
                />
              </Field>

              <Field label="Entreprise" error={errors.company_name?.message}>
                <Input
                  {...register('company_name')}
                  autoComplete="organization"
                  placeholder="Boulangerie Dupont"
                />
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Type de projet" error={errors.project_type?.message}>
                <Select {...register('project_type')} defaultValue="">
                  <option value="">Sélectionnez</option>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Budget envisagé"
                error={errors.budget_range?.message}
                hint="Une fourchette suffit, elle nous aide à calibrer la proposition."
              >
                <Select {...register('budget_range')} defaultValue="">
                  <option value="">Sélectionnez</option>
                  {BUDGET_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Votre projet"
              error={errors.message?.message}
              hint="Votre activité, ce que le site doit permettre, vos éventuelles échéances."
              required
            >
              <Textarea
                {...register('message')}
                rows={7}
                placeholder="Nous sommes une boulangerie à Fort-de-France. Nous souhaitons un site présentant nos produits et nos horaires, avec un formulaire de commande pour les gâteaux personnalisés."
              />
            </Field>

            {/* Transmis silencieusement quand le visiteur vient d'une carte tarifaire. */}
            <input type="hidden" {...register('plan_code')} />

            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-relaxed text-muted">
                Les informations recueillies sont destinées à HBG Labs pour l’analyse précontractuelle de votre projet (conservation 3 ans). Pour exercer vos droits RGPD, contactez <a href={`mailto:${site.contact.dpoEmail}`} className="text-primary hover:underline">{site.contact.dpoEmail}</a>. Consultez notre{' '}
                <a href="/politique-confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </a>
                .
              </p>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting || mutation.isPending}
                loadingLabel="Envoi de votre demande en cours"
              >
                Envoyer ma demande
              </Button>
            </div>
          </form>
        </Container>
      </Section>
    </>
  );
}
