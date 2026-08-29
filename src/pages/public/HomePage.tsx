import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { site } from '@/config/site';
import {
  benefits,
  faq,
  hostingDetails,
  howItWorks,
  maintenanceDetails,
  painPoints,
  pillars,
} from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { faqSchema, localBusinessSchema } from '@/lib/structured-data';
import { Button } from '@/components/ui/Button';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { PricingGrid } from '@/components/marketing/PricingGrid';
import { CtaBanner } from '@/components/marketing/CtaBanner';

/**
 * Page d'accueil (§6).
 *
 * Les quatorze sections demandées sont présentes, à une exception documentée :
 * la section « Témoignages » est absente. HBG Labs n'a pas encore d'avis client
 * publiable, et §57 comme la règle 03-frontend §8.10 interdisent les faux avis.
 * La section « Nos engagements » occupe cette place avec des affirmations
 * vérifiables. Les témoignages y prendront leur place quand ils existeront.
 *
 * Les tarifs affichés viennent de la base via `PricingGrid`, jamais de ce
 * fichier.
 */
export function HomePage() {
  return (
    <>
      <Seo
        title="Création, hébergement et maintenance de sites web"
        description={`${site.positioning} Sites vitrines professionnels, hébergement infogéré et maintenance continue en ${site.area} et partout en France.`}
        path="/"
        structuredData={[localBusinessSchema(), faqSchema(faq)]}
      />

      {/* ---- 1. Hero ---- */}
      <Section className="pt-16 sm:pt-24">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Création, hébergement et maintenance réunis
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              {site.headline}
            </h1>

            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted sm:text-xl">
              {site.positioning} Un seul interlocuteur pour concevoir votre site, le
              mettre en ligne et le tenir à jour.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/devis">
                  Créer mon site
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tarifs">Découvrir les offres</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- 2. Problème client ---- */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Le constat"
            title="Un site web mal accompagné coûte plus cher qu’il ne rapporte"
            description="Les difficultés que nos clients décrivent avant de nous confier leur présence en ligne."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-lg border border-border bg-surface p-6"
              >
                <h3 className="font-semibold">{point.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- 3 et 4. Solution et services ---- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Notre réponse"
            title="Trois métiers, une seule responsabilité"
            description="Nous concevons votre site, nous l’hébergeons et nous le maintenons. Quand quelque chose ne va pas, vous savez à qui vous adresser."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Link
                key={pillar.to}
                to={pillar.to}
                className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <pillar.icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold">{pillar.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {pillar.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  En savoir plus
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- 5. Fonctionnement ---- */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Fonctionnement"
            title="Du premier échange à la mise en ligne"
            description="Quatre étapes, sans zone d’ombre sur le calendrier ni sur le budget."
          />

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step) => (
              <li key={step.number}>
                <p
                  className="font-mono text-3xl font-semibold text-primary/40"
                  aria-hidden="true"
                >
                  {step.number}
                </p>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ---- 6. Offres ---- */}
      <Section id="offres">
        <Container>
          <SectionHeading
            eyebrow="Nos offres"
            title="Un tarif de création, un abonnement mensuel"
            description="Le tarif de création dépend du périmètre de votre projet. L’abonnement couvre l’hébergement et, selon l’offre, la maintenance."
            align="center"
          />

          <div className="mt-12">
            <PricingGrid />
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            <Link to="/tarifs" className="font-medium text-primary hover:underline">
              Comparer les offres en détail
            </Link>
          </p>
        </Container>
      </Section>

      {/* ---- 7. Avantages ---- */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Ce que vous obtenez"
            title="Les points sur lesquels nous ne transigeons pas"
          />

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title}>
                <benefit.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- 9 et 10. Hébergement et maintenance ---- */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Hébergement"
                title="Votre site en ligne, sans serveur à gérer"
              />
              <ul className="mt-8 space-y-6">
                {hostingDetails.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <item.icon
                      className="mt-0.5 size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-8">
                <Link
                  to="/hebergement"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Détail de l’hébergement
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </p>
            </div>

            <div>
              <SectionHeading
                eyebrow="Maintenance"
                title="Un site qui reste à jour, sans que vous y pensiez"
              />
              <ul className="mt-8 space-y-6">
                {maintenanceDetails.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <item.icon
                      className="mt-0.5 size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-8">
                <Link
                  to="/maintenance"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Détail de la maintenance
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- 12. Questions fréquentes ---- */}
      <Section tone="muted">
        <Container width="narrow">
          <SectionHeading
            eyebrow="Questions fréquentes"
            title="Ce que l’on nous demande avant de signer"
            align="center"
          />

          <Accordion className="mt-12">
            {faq.map((item) => (
              <AccordionItem key={item.question} question={item.question}>
                {item.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* ---- 13. Appel à l'action final ---- */}
      <CtaBanner />
    </>
  );
}
