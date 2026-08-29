import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { site } from '@/config/site';
import { benefits, pillars } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { CtaBanner } from '@/components/marketing/CtaBanner';

/** Vue d'ensemble des prestations (§5). */
export function ServicesPage() {
  return (
    <>
      <Seo
        title="Nos services"
        description={`Création de site web, hébergement infogéré et maintenance continue. HBG Labs prend en charge votre présence en ligne de bout en bout, en ${site.area} et partout en France.`}
        path="/services"
      />

      <Section>
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Services"
            title="Concevoir, héberger et maintenir votre site"
            description="Trois prestations complémentaires. Vous pouvez les prendre séparément, elles produisent leur plein effet ensemble."
          />

          <div className="mt-14 space-y-6">
            {pillars.map((pillar) => (
              <article
                key={pillar.to}
                className="rounded-lg border border-border bg-surface p-6 sm:p-8"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <pillar.icon
                    className="size-8 shrink-0 text-primary"
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
