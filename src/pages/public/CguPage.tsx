import { site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection } from '@/components/marketing/LegalPage';

/**
 * Conditions Générales d'Utilisation (CGU) de la plateforme et de l'espace client HBG Labs.
 */
export function CguPage() {
  return (
    <>
      <Seo
        title="Conditions générales d’utilisation"
        description="Conditions générales d’utilisation régissant l’accès au site et à l’espace client SaaS de HBG Labs."
        path="/cgu"
      />

      <LegalPage
        title="Conditions générales d’utilisation"
        updatedAt="2026-08-31"
        requiresLegalIdentity
      >
        <LegalSection title="1. Objet et champ d’application">
          <p>
            Les présentes Conditions Générales d’Utilisation (ci-après les «&nbsp;CGU&nbsp;») ont pour objet
            de définir les modalités et conditions d’accès et d’utilisation du site internet et de
            l’application SaaS mis à disposition par l’entreprise individuelle{' '}
            <strong className="font-medium text-foreground">{site.legalName}</strong> (ci-après «&nbsp;HBG Labs&nbsp;»).
          </p>
          <p className="mt-2">
            Toute navigation sur le site public ou connexion à l’espace client emporte acceptation
            pleine, entière et sans réserve des présentes CGU par l’utilisateur.
          </p>
        </LegalSection>

        <LegalSection title="2. Accès aux services et création de compte">
          <p>
            Le site public est accessible gratuitement à tout internaute. L’accès aux fonctionnalités
            avancées (gestion de site, suivi des noms de domaine, consultation des factures, émission de
            tickets de support et maintenance) nécessite la création préalable d’un compte client.
          </p>
          <p className="mt-2">
            Lors de la création de son compte, l’utilisateur s’engage à fournir des informations exactes,
            complètes et actualisées. Il s’engage à ne pas créer de compte sous une fausse identité.
          </p>
        </LegalSection>

        <LegalSection title="3. Sécurité des identifiants et responsabilité de l’utilisateur">
          <p>
            Les identifiants d’accès (adresse électronique et mot de passe) sont strictement personnels et
            confidentiels. L’utilisateur est seul responsable de la conservation de la confidentialité de son
            mot de passe ainsi que de toutes les opérations effectuées depuis son compte.
          </p>
          <p className="mt-2">
            Toute utilisation ou action réalisée depuis le compte d’un utilisateur est réputée avoir été
            effectuée par ce dernier. En cas de perte, de vol ou de suspicion de compromission de ses
            identifiants, l’utilisateur doit immédiatement modifier son mot de passe via l’écran dédié et
            en avertir HBG Labs par e-mail à l’adresse{' '}
            <a href={`mailto:${site.contact.email}`} className="text-primary hover:underline">
              {site.contact.email}
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="4. Règles d’usage et comportements prohibés">
          <p>L’utilisateur s’interdit formellement de :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li>Tenter de contourner, d’altérer ou de désactiver les mécanismes d’authentification et les politiques de sécurité (notamment l’isolation multi-tenant de la base de données).</li>
            <li>Extraire, aspirer, scanner ou collecter de manière automatisée des données de la plateforme sans autorisation écrite.</li>
            <li>Téléverser via les formulaires ou le système de tickets des fichiers malveillants, virus, scripts nuisibles ou contenus illicites.</li>
            <li>Usurper l’identité d’un tiers ou d’un autre client de la plateforme.</li>
            <li>Utiliser les ressources ou les serveurs d’hébergement à des fins contraires aux lois et réglementations en vigueur.</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Propriété intellectuelle de la plateforme">
          <p>
            La structure logicielle, les interfaces utilisateur, l’architecture, la charte graphique, les
            composants interactifs et le code source de la plateforme HBG Labs sont et demeurent la
            propriété intellectuelle exclusive de {site.legalName}.
          </p>
          <p className="mt-2">
            L’octroi d’un accès à l’espace client ne confère à l’utilisateur qu’un droit d’utilisation
            personnel, non exclusif, non transférable et révocable de la plateforme pour la durée de ses
            prestations, à l’exclusion de tout transfert de propriété intellectuelle sur l’outil SaaS.
          </p>
        </LegalSection>

        <LegalSection title="6. Disponibilité et maintenance">
          <p>
            HBG Labs met en œuvre des moyens techniques raisonnables pour assurer une disponibilité continue
            et sécurisée de la plateforme 24 heures sur 24 et 7 jours sur 7.
          </p>
          <p className="mt-2">
            L’accès à la plateforme peut toutefois être temporairement suspendu ou limité pour des raisons de
            maintenance corrective ou évolutive, de mise à jour des serveurs ou en cas d’urgence technique.
            HBG Labs s’efforce de programmer ces interventions sur des plages horaires réduisant l’impact pour
            les utilisateurs.
          </p>
        </LegalSection>

        <LegalSection title="7. Responsabilité">
          <p>
            HBG Labs ne saurait être tenue pour responsable des préjudices directs ou indirects résultant :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li>D’une mauvaise utilisation de la plateforme ou d’une négligence de l’utilisateur dans la garde de ses identifiants.</li>
            <li>D’une indisponibilité temporaire liée à une panne réseau ou d’un fournisseur d’infrastructure tiers (hébergeur, réseau internet).</li>
            <li>D’un événement de force majeure au sens de l’article 1218 du Code civil.</li>
          </ul>
        </LegalSection>

        <LegalSection title="8. Suspension et clôture de compte">
          <p>
            En cas de manquement grave ou répété d’un utilisateur aux présentes CGU, HBG Labs se réserve le
            droit de suspendre ou de résilier son accès à l’espace client, de plein droit et sans préavis,
            sans préjudice de toute action judiciaire qui pourrait être intentée.
          </p>
        </LegalSection>

        <LegalSection title="9. Évolution des conditions d’utilisation">
          <p>
            HBG Labs se réserve la faculté de modifier les présentes CGU à tout moment afin de les adapter
            aux évolutions techniques de la plateforme ou aux exigences légales. La version applicable est
            celle en ligne au moment de l’accès au site.
          </p>
        </LegalSection>

        <LegalSection title="10. Droit applicable et litiges">
          <p>
            Les présentes CGU sont soumises au droit français. Tout différend relatif à leur validité,
            interprétation ou exécution sera porté devant les tribunaux compétents dans le ressort du siège
            social de HBG Labs, sous réserve des règles d’attribution de compétence impératives applicables.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
