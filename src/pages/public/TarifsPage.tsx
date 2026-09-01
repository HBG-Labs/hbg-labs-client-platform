import { Shield, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { site } from '@/config/site';
import { faq } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { PricingGrid } from '@/components/marketing/PricingGrid';
import { CtaBanner } from '@/components/marketing/CtaBanner';

const optionsList = [
  { service: 'Page supplémentaire', price: '80 €' },
  { service: 'Logo professionnel', price: '150 €' },
  { service: 'Identité visuelle complète', price: 'à partir de 300 €' },
  { service: 'SEO avancé & Référencement local', price: 'à partir de 250 €' },
  { service: 'Fiche Google Business Profile', price: '100 €' },
  { service: 'Système de réservation en ligne', price: 'à partir de 200 €' },
  { service: 'Paiement en ligne (Stripe)', price: 'à partir de 150 €' },
  { service: 'Boutique E-commerce complète', price: 'à partir de 1 200 €' },
  { service: 'Blog & Espace actualités', price: '150 €' },
  { service: 'Site multilingue', price: 'à partir de 250 €' },
  { service: 'Intégration API & Outils externes', price: 'à partir de 250 €' },
  { service: 'Intervention ponctuelle', price: '50 € / h' },
  { service: 'Intervention urgente (sous 12h)', price: '75 € / h' },
];

const processSteps = [
  {
    step: '01',
    title: 'Échange',
    description: 'Nous discutons de votre activité, de vos besoins et de vos objectifs commerciaux.',
  },
  {
    step: '02',
    title: 'Proposition',
    description: 'Vous recevez un devis clair et détaillé avec un calendrier d’exécution précis.',
  },
  {
    step: '03',
    title: 'Création',
    description: 'Nous concevons votre site avec un design sur mesure, rapide, sécurisé et responsive.',
  },
  {
    step: '04',
    title: 'Validation',
    description: 'Vous testez le résultat et nous appliquons les séries de retouches prévues.',
  },
  {
    step: '05',
    title: 'Mise en ligne',
    description: 'Votre site est raccordé à votre nom de domaine et prêt à accueillir vos clients.',
  },
];

/**
 * Grille tarifaire complète HBG Labs.
 */
export function TarifsPage() {
  const pricingFaq = faq.filter((item) =>
    ['prix', 'abonnement', 'propriétaire', 'domaine'].some((keyword) =>
      item.question.toLowerCase().includes(keyword),
    ),
  );

  return (
    <>
      <Seo
        title="Tarifs"
        description="Tarifs de création, d’hébergement et de maintenance de site web. Formules Starter (490 €), Business (890 €) et Premium (1 490 €)."
        path="/tarifs"
      />

      {/* 1. Grille des offres principales */}
      <Section>
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Tarifs & Formules"
            title="Des offres claires, sans surprise à l’échéance"
            description="Chaque formule associe un coût de création initial et un abonnement mensuel HBG Care pour l’hébergement et l’entretien continu."
            align="center"
          />

          <div className="mt-14">
            <PricingGrid />
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <Alert tone="info" title="Comprendre les montants affichés">
              <p className="text-xs sm:text-sm leading-relaxed">
                Les tarifs de création indiqués « à partir de » sont établis précisément au devis selon le nombre de pages et les fonctionnalités. 
                Règlement en <strong>50 % à la commande</strong> et <strong>50 % à la livraison</strong>. 
                Tarifs nets de TVA (article 293 B du CGI — TVA non applicable).
              </p>
            </Alert>
          </div>
        </Container>
      </Section>

      {/* 2. Gamme HBG Care (Hébergement & Maintenance) */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Entretien & Sérénité"
            title="HBG Care : Hébergement & Maintenance"
            description="Votre site reste rapide, sécurisé et à jour après sa mise en ligne. Choisissez le niveau d'accompagnement adapté."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* HBG Care */}
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-ink">
                <Shield className="size-5 text-accent" aria-hidden="true" />
                <h3 className="font-serif text-xl font-normal">HBG Care</h3>
              </div>
              <p className="mt-2 text-3xl font-serif font-normal text-ink">29 € <span className="text-xs font-sans text-muted">/ mois</span></p>
              <p className="mt-2 text-xs text-muted">L’essentiel pour garder votre site en ligne sans interruption.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-ink">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Hébergement infogéré haute performance</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Certificat SSL & sécurité HTTPS</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Sauvegardes & surveillance continue</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Support par e-mail sous 48h</li>
              </ul>
            </div>

            {/* HBG Care Plus */}
            <div className="rounded-2xl border-2 border-accent bg-surface p-6 sm:p-7 shadow-md relative">
              <div className="absolute -top-3 left-6">
                <span className="rounded-full bg-accent px-3 py-0.5 text-[11px] font-semibold text-white">
                  Recommandé
                </span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Sparkles className="size-5 text-accent" aria-hidden="true" />
                <h3 className="font-serif text-xl font-normal">HBG Care Plus</h3>
              </div>
              <p className="mt-2 text-3xl font-serif font-normal text-ink">49 € <span className="text-xs font-sans text-muted">/ mois</span></p>
              <p className="mt-2 text-xs text-muted">Pour les entreprises qui souhaitent des mises à jour régulières.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-ink">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Tout ce qui est inclus dans HBG Care</li>
                <li className="flex items-center gap-2 font-medium text-accent"><CheckCircle2 className="size-3.5 text-accent" /> Jusqu’à 30 min de modifications/mois</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Vérifications & optimisation de vitesse</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Support prioritaire sous 24h ouvrées</li>
              </ul>
            </div>

            {/* HBG Care Pro */}
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-ink">
                <Clock className="size-5 text-accent" aria-hidden="true" />
                <h3 className="font-serif text-xl font-normal">HBG Care Pro</h3>
              </div>
              <p className="mt-2 text-3xl font-serif font-normal text-ink">79 € <span className="text-xs font-sans text-muted">/ mois</span></p>
              <p className="mt-2 text-xs text-muted">Déléguez intégralement la vie et l'optimisation de votre site.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-ink">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Tout ce qui est inclus dans HBG Care Plus</li>
                <li className="flex items-center gap-2 font-medium text-accent"><CheckCircle2 className="size-3.5 text-accent" /> Jusqu’à 1 h de modifications/mois</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Suivi SEO technique & rapport mensuel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-accent" /> Support prioritaire dédié direct</li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* 3. Tableau des options à la carte */}
      <Section>
        <Container width="narrow">
          <SectionHeading
            eyebrow="Sur mesure & Évolutions"
            title="Options & Services à la carte"
            description="Ajoutez des fonctionnalités spécifiques à votre projet selon vos besoins de développement."
            align="center"
          />

          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
            <div className="divide-y divide-border">
              {optionsList.map((item) => (
                <div
                  key={item.service}
                  className="flex items-center justify-between p-4 sm:px-6 transition-colors hover:bg-surface-muted/40"
                >
                  <span className="text-sm font-medium text-ink">{item.service}</span>
                  <span className="text-sm font-semibold text-accent">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* 4. Processus en 5 étapes */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Méthodologie"
            title="Comment se déroule votre projet ?"
            description="Une démarche fluide et transparente de la première prise de contact jusqu'à la mise en ligne."
            align="center"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="font-serif text-3xl font-normal text-accent/80">{step.step}</span>
                  <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 5. FAQ Tarifs */}
      <Section>
        <Container width="narrow">
          <SectionHeading
            eyebrow="Bon à savoir"
            title="Questions fréquentes sur les tarifs"
            align="center"
          />

          <Accordion className="mt-10">
            {(pricingFaq.length > 0 ? pricingFaq : faq).map((item) => (
              <AccordionItem key={item.question} question={item.question}>
                {item.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* 6. CTA Devis sur mesure */}
      <CtaBanner
        title="Vous avez un projet sur mesure ?"
        description={`E-commerce, plateforme métier, simulateur ou application web. HBG Labs conçoit votre solution digitale sur mesure, en ${site.area} comme ailleurs.`}
      />
    </>
  );
}
