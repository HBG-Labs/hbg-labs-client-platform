import { Link } from 'react-router-dom';
import { site } from '@/config/site';
import { maintenanceDetails } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { PublicPageHero } from '@/components/marketing/PublicPageHero';

/**
 * Page « Maintenance » (§5).
 *
 * Les exemples de demandes reprennent ceux de §25, qui décrit la fonctionnalité
 * « Demander une modification » de l'espace client.
 */
export function MaintenancePage() {
  const requestExamples = [
    'Changer un texte ou un titre',
    'Remplacer ou ajouter une photo',
    'Modifier vos horaires d’ouverture',
    'Ajouter une section à une page',
    'Créer une nouvelle page',
    'Ajouter un bouton ou un lien',
  ];

  return (
    <>
      <Seo
        title="Maintenance de site web"
        description={`Maintenance de site web professionnel : mises à jour techniques, sauvegardes, corrections et modifications de contenu prises en charge. En ${site.area} et partout en France.`}
        path="/maintenance"
      />

      <PublicPageHero
        eyebrow="Maintenance"
        title="Votre site reste vivant après sa mise en ligne."
        description="Mises à jour, sauvegardes et demandes de modification sont traitées au même endroit, par une équipe qui connaît déjà votre projet."
      >
          <div>
            <Button asChild size="lg">
              <Link to="/tarifs">Voir les offres avec maintenance</Link>
            </Button>
          </div>
      </PublicPageHero>

      <Section tone="muted">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">Ce que couvre la maintenance</h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {maintenanceDetails.map((item) => (
              <div key={item.title} className="flex gap-4">
                <item.icon
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container width="narrow">
          <SectionHeading
            eyebrow="Demandes de modification"
            title="Vous décrivez, nous appliquons"
            description="Depuis votre espace client, vous ouvrez une demande. Elle arrive directement dans notre file de traitement, avec son historique et son statut."
          />

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {requestExamples.map((example) => (
              <li
                key={example}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                {example}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm leading-relaxed text-muted">
            Le nombre de demandes incluses dépend de votre offre. Une modification qui
            relève d’un développement supplémentaire fait l’objet d’un devis distinct,
            présenté avant toute intervention.
          </p>
        </Container>
      </Section>

      <CtaBanner
        title="Votre site actuel demande de l’attention ?"
        description="Nous auditons son état technique et vous proposons une reprise en maintenance adaptée."
      />
    </>
  );
}
