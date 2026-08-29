import { site } from '@/config/site';
import { faq } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { PricingGrid } from '@/components/marketing/PricingGrid';
import { CtaBanner } from '@/components/marketing/CtaBanner';

/**
 * Grille tarifaire (§5, §7).
 *
 * Aucun montant dans ce fichier. `PricingGrid` lit `plans`, `plan_prices` et
 * `plan_features` depuis Supabase, via les policies de lecture publique de la
 * migration 04.
 */
export function TarifsPage() {
  // Les questions liées au prix et à l'engagement, remontées ici.
  const pricingFaq = faq.filter((item) =>
    ['prix', 'abonnement', 'propriétaire', 'domaine'].some((keyword) =>
      item.question.toLowerCase().includes(keyword),
    ),
  );

  return (
    <>
      <Seo
        title="Tarifs"
        description={`Tarifs de création, d’hébergement et de maintenance de site web. Offres Starter, Pro et Business, avec abonnement mensuel et tarif de création établi au devis.`}
        path="/tarifs"
      />

      <Section>
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Tarifs"
            title="Des offres claires, sans surprise à l’échéance"
            description={`Chaque offre associe un tarif de création et un abonnement mensuel. L’abonnement couvre l’hébergement et, à partir de l’offre Pro, la maintenance.`}
            align="center"
          />

          <div className="mt-14">
            <PricingGrid />
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <Alert tone="info" title="Comprendre les montants affichés">
              <p>
                Les tarifs de création portant la mention « à partir de » sont des points
                de départ. Le montant définitif dépend du nombre de pages et des
                fonctionnalités, il vous est communiqué au devis avant tout engagement.
                Les montants sont exprimés hors taxes.
              </p>
            </Alert>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container width="narrow">
          <SectionHeading
            eyebrow="Bon à savoir"
            title="Questions sur les tarifs et l’engagement"
            align="center"
          />

          <Accordion className="mt-10">
            {(pricingFaq.length > 0 ? pricingFaq : faq).map((item) => (
              <AccordionItem key={item.question} question={item.question}>
                {item.answer}
              </AccordionItem>
            ))}
          </Accordion>

          <p className="mt-8 text-center text-sm text-muted">
            Une question qui ne figure pas ici ? Écrivez-nous, nous répondons sous
            24 heures ouvrées.
          </p>
        </Container>
      </Section>

      <CtaBanner
        title="Une offre sur mesure ?"
        description={`Si aucune de ces formules ne correspond à votre projet, décrivez-le nous. HBG Labs construit des propositions adaptées, en ${site.area} comme ailleurs.`}
      />
    </>
  );
}
