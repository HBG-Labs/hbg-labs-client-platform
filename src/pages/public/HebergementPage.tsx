import { Link } from 'react-router-dom';
import { site } from '@/config/site';
import { hostingDetails } from '@/content/marketing';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Layout';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { PublicPageHero } from '@/components/marketing/PublicPageHero';

/**
 * Page « Hébergement » (§5).
 *
 * L'encart sur la supervision reprend la règle du §17 : tant qu'aucune
 * intégration ne vérifie l'état d'un site, l'espace client affiche
 * « Vérification non configurée ». L'annoncer ici évite de promettre une
 * surveillance temps réel qui n'existe pas encore.
 */
export function HebergementPage() {
  return (
    <>
      <Seo
        title="Hébergement de site web infogéré"
        description={`Hébergement de site web professionnel : infrastructure Vercel, certificat SSL automatique, configuration DNS et supervision. Sans serveur à administrer, en ${site.area} et partout en France.`}
        path="/hebergement"
      />

      <PublicPageHero
        eyebrow="Hébergement"
        title="Votre site, toujours à sa place."
        description="Nous prenons en charge l’infrastructure, le certificat et le domaine. Vous n’avez ni serveur à gérer, ni détail technique à surveiller."
      >
          <div>
            <Button asChild size="lg">
              <Link to="/tarifs">Voir les tarifs d’hébergement</Link>
            </Button>
          </div>
      </PublicPageHero>

      <Section tone="muted">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">Ce qui est inclus</h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {hostingDetails.map((item) => (
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
          <h2 className="text-2xl font-semibold tracking-tight">
            Ce que vous voyez dans votre espace client
          </h2>

          <p className="mt-4 leading-relaxed text-muted">
            L’état de votre site et de votre domaine est affiché dans votre espace :
            statut DNS, certificat SSL, date du dernier déploiement.
          </p>

          <Alert tone="info" title="Un principe qui nous tient à cœur" className="mt-8">
            <p>
              Un voyant ne passe au vert que si une vérification réelle a eu lieu. Tant
              que la remontée automatique d’état n’est pas active sur votre site, votre
              espace affiche « Vérification non configurée » plutôt qu’un statut
              rassurant mais invérifiable.
            </p>
          </Alert>

          <h2 className="mt-16 text-2xl font-semibold tracking-tight">
            Votre domaine reste le vôtre
          </h2>

          <p className="mt-4 leading-relaxed text-muted">
            Le nom de domaine est enregistré à votre nom. Nous en assurons la
            configuration technique et le suivi de l’échéance. Si vous quittez HBG Labs,
            vous partez avec.
          </p>
        </Container>
      </Section>

      <CtaBanner
        title="Besoin d’héberger un site existant ?"
        description="Nous auditons votre site actuel et vous disons si une reprise en hébergement est réaliste, ou si une refonte serait plus économique."
      />
    </>
  );
}
