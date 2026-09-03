import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
import { ShowcaseGallery } from '@/components/marketing/ShowcaseGallery';
import { CtaBanner } from '@/components/marketing/CtaBanner';

/**
 * Page d'accueil (§6).
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
      <section className="relative isolate overflow-hidden bg-[#0e1917] text-white" aria-label="Présentation de HBG Labs">
        <img
          src="/images/hero-alpine.jpg"
          alt="Un poste de travail face à un paysage montagneux"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,18,16,0.92)_0%,rgba(8,18,16,0.7)_43%,rgba(8,18,16,0.2)_100%)]" />
        <Container width="wide" className="flex min-h-[min(760px,calc(100svh-52px))] flex-col justify-between py-12 sm:py-16 lg:py-20">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            <span className="size-2 rounded-full bg-brand-300 shadow-[0_0_0_5px_rgba(134,239,172,0.14)]" aria-hidden="true" />
            Studio digital basé en Martinique
          </div>

          <div className="grid items-end gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-20">
            <div className="max-w-4xl">
              <h1 id="hero-heading" className="text-balance font-serif text-[clamp(4rem,9vw,8.5rem)] leading-[0.83] tracking-[-0.045em]">
                Votre activité mérite<br />{' '}
                <span className="italic text-brand-200">sa propre allure.</span>
              </h1>
              <p className="mt-8 max-w-xl text-pretty text-base leading-7 text-white/82 sm:text-lg">
                Nous concevons des sites singuliers, rapides et suivis dans la durée. Une présence digitale qui fait son travail, jour après jour.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="primary" className="group bg-white px-7 text-ink hover:bg-brand-100">
                  <Link to="/devis">Parler de votre projet <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/5 px-7 text-white hover:bg-white/15 hover:text-white">
                  <Link to="/showcase">Voir nos réalisations</Link>
                </Button>
              </div>
            </div>

            <aside className="border-l border-white/30 pl-5 text-sm leading-6 text-white/75 lg:pb-2">
              <p className="font-serif text-2xl leading-none text-white">Un seul partenaire.</p>
              <p className="mt-3">Création, hébergement, domaine et maintenance restent entre les mêmes mains.</p>
            </aside>
          </div>

          <div className="grid gap-3 border-t border-white/25 pt-5 text-xs font-medium uppercase tracking-[0.16em] text-white/70 sm:grid-cols-3">
            <span>Conception sur mesure</span>
            <span>Hébergement infogéré</span>
            <span>Maintenance continue</span>
          </div>
        </Container>
      </section>

      {/* ---- 2. Problème client ---- */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Le constat"
            title="Un site web mal accompagné coûte plus cher qu’il ne rapporte"
            description="Les difficultés que nos clients décrivent avant de nous confier leur présence en ligne."
          />

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {painPoints.map((point, index) => (
              <div
                key={point.title}
                className="bg-surface p-7 sm:p-8"
              >
                <span className="font-serif text-3xl text-accent/60" aria-hidden="true">0{index + 1}</span>
                <h3 className="font-sans text-lg font-semibold text-ink">{point.title}</h3>
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

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Link
                key={pillar.to}
                to={pillar.to}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-8"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <pillar.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {pillar.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  En savoir plus
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- Showcase & Réalisations Métiers ---- */}
      <ShowcaseGallery />

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
              <li key={step.number} className="flex flex-col">
                <p
                  className="font-serif text-4xl font-normal text-accent/50"
                  aria-hidden="true"
                >
                  {step.number}
                </p>
                <h3 className="mt-3 font-sans text-base font-semibold text-ink">{step.title}</h3>
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
            <Link to="/tarifs" className="font-medium text-accent hover:underline">
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
                <benefit.icon className="size-5 text-accent" aria-hidden="true" />
                <h3 className="mt-3 font-sans font-semibold text-ink">{benefit.title}</h3>
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
                      className="mt-0.5 size-5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-sans font-medium text-ink">{item.title}</h3>
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
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
                      className="mt-0.5 size-5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-sans font-medium text-ink">{item.title}</h3>
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
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
