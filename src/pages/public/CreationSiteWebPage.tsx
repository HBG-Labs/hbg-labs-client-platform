import { Link } from 'react-router-dom';
import { site } from '@/config/site';
import { creationProcess } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { PricingGrid } from '@/components/marketing/PricingGrid';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { PublicPageHero } from '@/components/marketing/PublicPageHero';

/**
 * Page « Création de site web » (§5).
 *
 * Cible de référencement principale : « création site web »,
 * « création site internet Martinique », « création site professionnel » (§41).
 */
export function CreationSiteWebPage() {
  const included = [
    'Cadrage du projet et définition de l’arborescence',
    'Maquettes des pages principales, sur mobile et sur ordinateur',
    'Développement et intégration des contenus',
    'Affichage adapté au téléphone, à la tablette et à l’ordinateur',
    'Formulaire de contact relié à votre adresse électronique',
    'Optimisation des images et du temps de chargement',
    'Titres, descriptions, sitemap et robots.txt pour les moteurs de recherche',
    'Certificat SSL et raccordement de votre nom de domaine',
    'Recette avec vous avant la mise en production',
  ];

  return (
    <>
      <Seo
        title="Création de site web professionnel"
        description={`Création de site internet professionnel en ${site.area} et partout en France. Site vitrine responsive, optimisé pour le référencement, livré avec hébergement et maintenance.`}
        path="/creation-site-web"
      />

      <PublicPageHero
        eyebrow="Création de site web"
        title="Un site qui ressemble enfin à votre entreprise."
        description="Nous partons de vos objectifs et de votre clientèle, jamais d’un gabarit. Les maquettes sont validées avant le développement."
      >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/devis">Demander un devis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/tarifs">Voir les tarifs</Link>
            </Button>
          </div>
      </PublicPageHero>

      <Section tone="muted" spacing="tight">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">
            Ce que comprend la création
          </h2>

          <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Processus"
            title="Six étapes, du cadrage au suivi"
            description="Chaque étape se termine par une validation de votre part. Rien n’avance sans votre accord."
          />

          <ol className="mt-12 space-y-8">
            {creationProcess.map((step) => (
              <li key={step.number} className="flex gap-5 sm:gap-8">
                <p
                  className="font-mono text-2xl font-semibold text-primary/40"
                  aria-hidden="true"
                >
                  {step.number}
                </p>
                <div className="flex-1 border-b border-border pb-8 last:border-b-0">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Tarifs"
            title="Un tarif de création, puis un abonnement"
            description="Le montant de création dépend du nombre de pages et des fonctionnalités. Les tarifs ci-dessous sont des points de départ, le devis fixe le montant définitif."
            align="center"
          />
          <div className="mt-12">
            <PricingGrid />
          </div>
        </Container>
      </Section>

      <CtaBanner
        title="Un projet de site en tête ?"
        description="Décrivez-le en quelques lignes. Nous revenons vers vous avec un périmètre chiffré et un calendrier."
      />
    </>
  );
}
