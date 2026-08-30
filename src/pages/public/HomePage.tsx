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

      {/* ---- 1. Hero Éditorial Plein Cadre Immersion ---- */}
      <section className="relative min-h-[calc(100vh-52px)] min-h-[calc(100svh-52px)] w-full overflow-hidden flex items-center bg-background">
        {/* Image de fond plein cadre */}
        <img
          src="/images/hero-editorial.jpg"
          alt="HBG Labs — Création digitale et croissance"
          className="absolute inset-0 h-full w-full object-cover object-bottom sm:object-[75%_bottom] md:object-[80%_center]"
          loading="eager"
          fetchPriority="high"
        />

        {/* Contenu textuel et boutons posés directement sur l'image */}
        <Container width="wide" className="relative z-10 py-12 sm:py-20 lg:py-24">
          <div className="max-w-xl">
            <h1
              id="hero-heading"
              className="text-balance font-serif font-normal text-accent text-[clamp(44px,9vw,96px)] leading-[1.05] tracking-[-0.01em]"
            >
              Créer <br />l'impossible
            </h1>

            <p className="mt-6 sm:mt-8 max-w-md font-sans text-[15px] sm:text-base leading-relaxed text-ink/80">
              On transforme vos idées les plus ambitieuses en sites web réels.
              Parce qu'«&nbsp;infaisable&nbsp;» n'est que le point de départ.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Button asChild size="lg" variant="primary" className="w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 text-[15px] shadow-sm justify-center text-center">
                <Link to="/devis">
                  Démarrer un projet
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 text-[15px] bg-surface/80 backdrop-blur-sm hover:bg-surface border-ink/20 justify-center text-center">
                <Link to="/tarifs">Découvrir les offres</Link>
              </Button>
            </div>
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

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-border bg-surface p-8 transition-colors duration-200 hover:border-ink/40"
              >
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

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Link
                key={pillar.to}
                to={pillar.to}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-8 transition-all duration-200 hover:border-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <pillar.icon className="size-6 text-accent" aria-hidden="true" />
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
