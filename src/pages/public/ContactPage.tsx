import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { site } from '@/config/site';
import {
  contactMessageSchema,
  type ContactMessageInput,
  type ContactMessageValues,
} from '@/schemas/lead.schema';
import { useSubmitContactMessage } from '@/features/leads/useSubmitLead';
import { LeadRateLimitError } from '@/services/leads.service';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';

/**
 * Formulaire de contact (§5).
 *
 * Écrit dans `contact_messages` par la policy `contact_messages_insert_anon`.
 * Les coordonnées affichées à côté du formulaire proviennent de la
 * configuration : tant qu'elles ne sont pas renseignées, le bloc est masqué
 * plutôt que rempli d'une adresse fictive.
 */
export function ContactPage() {
  const mutation = useSubmitContactMessage();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageInput, unknown, ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  const { email, phone } = site.contact;
  const hasContactDetails = Boolean(email || phone);
  const rateLimited = mutation.error instanceof LeadRateLimitError;

  return (
    <>
      <Seo
        title="Contact"
        description={`Contactez HBG Labs pour votre projet de site web, votre hébergement ou votre maintenance. Réponse sous 24 heures ouvrées.`}
        path="/contact"
      />

      <Section>
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Contact"
            title="Écrivez-nous"
            description="Une question sur nos offres, un projet à cadrer ou un site existant à reprendre. Nous répondons sous 24 heures ouvrées."
          />

          <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
            <div>
              {mutation.isSuccess ? (
                <div className="rounded-lg border border-success/30 bg-success-surface p-8 text-center">
                  <CheckCircle2
                    className="mx-auto size-10 text-success"
                    aria-hidden="true"
                  />
                  <h2 className="mt-5 text-xl font-semibold">Message envoyé</h2>
                  <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
                    Nous revenons vers vous sous 24 heures ouvrées à l’adresse
                    électronique indiquée.
                  </p>
                  <div className="mt-6">
                    <Button variant="outline" onClick={() => mutation.reset()}>
                      Écrire un autre message
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {mutation.isError && (
                    <Alert
                      tone={rateLimited ? 'warning' : 'danger'}
                      title={
                        rateLimited ? 'Trop de messages envoyés' : 'L’envoi a échoué'
                      }
                      className="mb-8"
                    >
                      <p>{mutation.error.message}</p>
                    </Alert>
                  )}

                  <form onSubmit={onSubmit} noValidate className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field
                        label="Nom et prénom"
                        error={errors.full_name?.message}
                        required
                      >
                        <Input
                          {...register('full_name')}
                          autoComplete="name"
                          placeholder="Marie Dupont"
                        />
                      </Field>

                      <Field
                        label="Adresse électronique"
                        error={errors.email?.message}
                        required
                      >
                        <Input
                          {...register('email')}
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="marie.dupont@exemple.fr"
                        />
                      </Field>
                    </div>

                    <Field label="Téléphone" error={errors.phone?.message}>
                      <Input
                        {...register('phone')}
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="0596 00 00 00"
                      />
                    </Field>

                    <Field label="Objet" error={errors.subject?.message} required>
                      <Input
                        {...register('subject')}
                        placeholder="Question sur l’offre Pro"
                      />
                    </Field>

                    <Field label="Message" error={errors.message?.message} required>
                      <Textarea
                        {...register('message')}
                        rows={7}
                        placeholder="Bonjour, je souhaiterais savoir si…"
                      />
                    </Field>

                    <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-md text-xs leading-relaxed text-muted">
                        Les données recueillies sont traitées par HBG Labs pour répondre à votre demande (conservation max. 3 ans). Pour exercer vos droits d’accès, de rectification ou d’effacement, écrivez à <a href={`mailto:${site.contact.dpoEmail}`} className="text-primary hover:underline">{site.contact.dpoEmail}</a>. Consultez notre{' '}
                        <a
                          href="/politique-confidentialite"
                          className="text-primary hover:underline"
                        >
                          politique de confidentialité
                        </a>
                        .
                      </p>

                      <Button
                        type="submit"
                        size="lg"
                        isLoading={isSubmitting || mutation.isPending}
                        loadingLabel="Envoi de votre message en cours"
                      >
                        Envoyer
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <aside className="space-y-8">
              {hasContactDetails && (
                <div className="rounded-lg border border-border bg-surface p-6">
                  <h2 className="font-semibold">Nous joindre directement</h2>
                  <ul className="mt-4 space-y-3 text-sm">
                    {email && (
                      <li className="flex gap-3">
                        <Mail
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <a href={`mailto:${email}`} className="hover:underline">
                          {email}
                        </a>
                      </li>
                    )}
                    {phone && (
                      <li className="flex gap-3">
                        <Phone
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <a
                          href={`tel:${phone.replace(/\s/g, '')}`}
                          className="hover:underline"
                        >
                          {phone}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-border bg-surface p-6">
                <h2 className="font-semibold">Zone d’intervention</h2>
                <p className="mt-3 flex gap-3 text-sm leading-relaxed text-muted">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Implantés en {site.area}, nous intervenons à distance partout en
                    France. Les échanges se font par visioconférence, téléphone et espace
                    client.
                  </span>
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-6">
                <h2 className="font-semibold">Un projet à chiffrer ?</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Le formulaire de devis pose les bonnes questions et accélère notre
                  réponse.
                </p>
                <Button asChild variant="outline" fullWidth className="mt-4">
                  <a href="/devis">Demander un devis</a>
                </Button>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
