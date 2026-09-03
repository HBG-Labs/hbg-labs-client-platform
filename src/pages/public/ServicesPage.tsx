import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { site } from '@/config/site';
import { benefits, pillars } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { PublicPageHero } from '@/components/marketing/PublicPageHero';

/** Vue d'ensemble des prestations (§5). */
export function ServicesPage() {
  return (
    <>
      <Seo
        title="Nos services"
        description={`Création de site web, hébergement infogéré et maintenance continue. HBG Labs prend en charge votre présence en ligne de bout en bout, en ${site.area} et partout en France.`}
        path="/services"
      />

      <PublicPageHero
        eyebrow="Services"
        title="Une présence digitale tenue de bout en bout."
        description="Conception, hébergement et maintenance : trois expertises réunies pour que votre site reste juste, rapide et utile."
      />

      <Section>
        <Container>

          <div className="mt-14 space-y-6">
            {pillars.map((pillar) => (
              <article
                key={pillar.to}
                className="group rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-xl sm:p-9"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <pillar.icon
                    className="size-10 shrink-0 rounded-full bg-brand-100 p-2 text-accent transition-colors group-hover:bg-accent group-hover:text-white"
                    aria-hidden="true"
                  />

                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{pillar.title}</h2>
                    <p className="mt-3 leading-relaxed text-muted">{pillar.description}</p>

                    <p className="mt-5">
                      <Link
                        to={pillar.to}
                        className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        Voir le détail
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos engagements"
            title="Ce qui vaut pour toutes nos prestations"
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

      <CtaBanner />
    </>
  );
}
