import { formattedAddress, site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection, LegalValue } from '@/components/marketing/LegalPage';

/**
 * Mentions légales obligatoires au titre de l'article 6 III de la loi n° 2004-575
 * du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).
 */
export function MentionsLegalesPage() {
  const { legal, host, contact } = site;

  return (
    <>
      <Seo
        title="Mentions légales"
        description="Mentions légales de la plateforme HBG Labs : éditeur, directeur de la publication, hébergeur et cadre réglementaire."
        path="/mentions-legales"
        noIndex
      />

      <LegalPage title="Mentions légales" updatedAt="2026-08-31" requiresLegalIdentity>
        <LegalSection title="1. Éditeur de la plateforme">
          <p className="mb-4">
            Le site internet accessible à l’adresse{' '}
            <span className="font-medium text-foreground">hbglabs.com</span> et son
            application SaaS client sont édités par l’entreprise individuelle{' '}
            <strong className="font-semibold text-foreground">{site.legalName}</strong>.
          </p>
          <LegalValue label="Dénomination" value={site.legalName} />
          <LegalValue label="Forme juridique" value={legal.legalForm} />
          <LegalValue label="Siège social" value={formattedAddress()} />
          <LegalValue label="Numéro SIRET" value={legal.siret} />
          <LegalValue label="Numéro SIREN" value={legal.siren} />
          <LegalValue label="Registre du Commerce et des Sociétés" value={legal.rcs} />
          <LegalValue label="TVA intracommunautaire" value={legal.vatNumber} />
          <LegalValue label="Adresse électronique" value={contact.email} />
          <LegalValue label="Délégué à la protection des données (DPO)" value={contact.dpoEmail} />
        </LegalSection>

        <LegalSection title="2. Directeur de la publication">
          <LegalValue label="Responsable de publication" value={legal.publicationDirector} />
          <p className="mt-2 text-sm text-muted">
            En qualité de représentant légal de l’entreprise individuelle {site.legalName}.
          </p>
        </LegalSection>

        <LegalSection title="3. Hébergement de la plateforme">
          <p>
            Le site web et ses services applicatifs sont hébergés par la société{' '}
            <strong className="font-semibold text-foreground">{host.name}</strong>.
          </p>
          <LegalValue label="Raison sociale" value={host.name} />
          <LegalValue label="Adresse de l’hébergeur" value={host.address} />
          <p className="mt-2">
            Site web de l’hébergeur :{' '}
            <a
              href={host.website}
              className="text-primary hover:underline"
              rel="noreferrer noopener"
              target="_blank"
            >
              {host.website}
            </a>
          </p>
          <p className="mt-3 text-sm text-muted">
            La base de données et les services de stockage sécurisé sont hébergés au sein de
            l’Union européenne (Irlande) par Supabase Inc.
          </p>
        </LegalSection>

        <LegalSection title="4. Propriété intellectuelle">
          <p>
            L’ensemble des contenus présents sur ce site (textes, graphismes, logotypes, icônes,
            vidéos, sons, logiciels, charte graphique et code source) est la propriété exclusive de{' '}
            {site.name} ou de ses partenaires et est protégé par les lois françaises et
            internationales relatives à la propriété intellectuelle (articles L.111-1 et suivants
            du Code de la propriété intellectuelle).
          </p>
          <p className="mt-2">
            Toute reproduction, représentation, modification, publication, adaptation de tout ou
            partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est
            strictement interdite sans autorisation écrite préalable de {site.name}.
          </p>
          <p className="mt-2">
            Les sites internet et réalisations développés pour nos clients demeurent la propriété de
            ces derniers selon les stipulations définies dans leurs devis et nos{' '}
            <a href="/cgv" className="text-primary hover:underline">
              Conditions Générales de Vente
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="5. Données personnelles et cookies">
          <p>
            Les modalités de collecte, de traitement et de protection des données à caractère
            personnel par {site.name} sont détaillées dans notre{' '}
            <a href="/politique-confidentialite" className="text-primary hover:underline">
              Politique de confidentialité
            </a>
            .
          </p>
          <p className="mt-2">
            Pour toute information relative aux traceurs et mécanismes de stockage local utilisés
            sur ce site, veuillez consulter notre{' '}
            <a href="/cookies" className="text-primary hover:underline">
              Politique relative aux cookies
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="6. Droit applicable et juridiction compétente">
          <p>
            Le présent site et ses mentions légales sont régis par le droit français. Tout litige
            relatif à l’utilisation du site ou à la validité des présentes informations qui ne
            pourrait faire l’objet d’un règlement amiable sera soumis aux tribunaux français
            compétents dans le ressort du siège de l’éditeur.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
