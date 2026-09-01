import { Shield, Sparkles, Clock } from 'lucide-react';
import { site } from '@/config/site';
import { faq } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { PricingGrid } from '@/components/marketing/PricingGrid';
import { ProcessMarquee } from '@/components/marketing/ProcessMarquee';
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
        description="Tarifs de création, d’hébergement et de maintenance de site web. Formules Starter (580 €), Business (890 €) et Premium (1 490 €)."
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

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200 border border-stone-200 rounded-none bg-white">
            {/* HBG Care */}
            <div className="p-7 sm:p-9 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 min-h-[36px]">
                  <Shield className="size-5 text-stone-700" aria-hidden="true" />
                  <h3 className="font-serif text-3xl font-normal text-ink">HBG Care</h3>
                </div>

                <p className="mt-2.5 text-sm text-stone-600 leading-relaxed min-h-[44px]">
                  L’essentiel pour garder votre site en ligne sans interruption.
                </p>

                <div className="mt-8 mb-6">
                  <p className="text-xs font-sans text-stone-500 font-medium">Abonnement</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">29 €</span>
                    <span className="text-xs font-bold text-stone-500 tracking-wider">/ mois</span>
                  </div>
                </div>

                <div className="border-t border-stone-200/80 my-8" />

                <div>
                  <h4 className="text-sm font-bold text-ink mb-4">Inclus</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Hébergement infogéré haute performance</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Certificat SSL & sécurité HTTPS</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Sauvegardes & surveillance continue</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Support par e-mail sous 48h</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* HBG Care Plus */}
            <div className="p-7 sm:p-9 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 min-h-[36px]">
                  <Sparkles className="size-5 text-stone-700" aria-hidden="true" />
                  <h3 className="font-serif text-3xl font-normal text-ink">HBG Care Plus</h3>
                </div>

                <p className="mt-2.5 text-sm text-stone-600 leading-relaxed min-h-[44px]">
                  Pour les entreprises qui souhaitent des mises à jour régulières.
                </p>

                <div className="mt-8 mb-6">
                  <p className="text-xs font-sans text-stone-500 font-medium">Abonnement</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">49 €</span>
                    <span className="text-xs font-bold text-stone-500 tracking-wider">/ mois</span>
                  </div>
                </div>

                <div className="border-t border-stone-200/80 my-8" />

                <div>
                  <h4 className="text-sm font-bold text-ink mb-4">Inclus</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Tout ce qui est inclus dans HBG Care</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800 font-medium">Jusqu’à 30 min de modifications/mois</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Vérifications & optimisation de vitesse</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Support prioritaire sous 24h ouvrées</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* HBG Care Pro */}
            <div className="p-7 sm:p-9 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 min-h-[36px]">
                  <Clock className="size-5 text-stone-700" aria-hidden="true" />
                  <h3 className="font-serif text-3xl font-normal text-ink">HBG Care Pro</h3>
                </div>

                <p className="mt-2.5 text-sm text-stone-600 leading-relaxed min-h-[44px]">
                  Déléguez intégralement la vie et l'optimisation de votre site.
                </p>

                <div className="mt-8 mb-6">
                  <p className="text-xs font-sans text-stone-500 font-medium">Abonnement</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">79 €</span>
                    <span className="text-xs font-bold text-stone-500 tracking-wider">/ mois</span>
                  </div>
                </div>

                <div className="border-t border-stone-200/80 my-8" />

                <div>
                  <h4 className="text-sm font-bold text-ink mb-4">Inclus</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Tout ce qui est inclus dans HBG Care Plus</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800 font-medium">Jusqu’à 1 h de modifications/mois</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Suivi SEO technique & rapport mensuel</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                      <span className="leading-tight text-stone-800">Support prioritaire dédié direct</span>
                    </li>
                  </ul>
                </div>
              </div>
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

          <div className="mt-10 overflow-hidden rounded-none border border-stone-200 bg-white">
            <div className="divide-y divide-stone-200">
              {optionsList.map((item) => (
                <div
                  key={item.service}
                  className="flex items-center justify-between p-4 sm:px-6 transition-colors hover:bg-stone-50/60"
                >
                  <span className="text-sm font-medium text-ink">{item.service}</span>
                  <span className="text-sm font-semibold text-ink">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* 4. Processus en 5 étapes */}
      <Section tone="muted">
        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Méthodologie"
            title="Comment se déroule votre projet ?"
            description="Une démarche fluide et transparente de la première prise de contact jusqu'à la mise en ligne."
            align="center"
          />

          <div className="mt-12">
            <ProcessMarquee steps={processSteps} />
          </div>
        </div>
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
