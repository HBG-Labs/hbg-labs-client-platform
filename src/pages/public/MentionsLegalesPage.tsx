import { formattedAddress, site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection, LegalValue } from '@/components/marketing/LegalPage';

/** Mentions légales, obligatoires au titre de l'article 6 III de la LCEN. */
export function MentionsLegalesPage() {
  const { legal, host, contact } = site;

  return (
    <>
      <Seo
        title="Mentions légales"
        description="Mentions légales du site HBG Labs : éditeur, directeur de la publication et hébergeur."
        path="/mentions-legales"
        noIndex
      />

      <LegalPage title="Mentions légales" updatedAt="2026-08-28" requiresLegalIdentity>
        <LegalSection title="Éditeur du site">
          <LegalValue label="Dénomination" value={site.legalName} />
          <LegalValue label="Forme juridique" value={legal.legalForm} />
          <LegalValue label="Siège social" value={formattedAddress()} />
          <LegalValue label="SIRET" value={legal.siret} />
          <LegalValue label="Numéro de TVA intracommunautaire" value={legal.vatNumber} />
          <LegalValue label="Capital social" value={legal.shareCapital} />
          <LegalValue label="Adresse de contact" value={contact.email} />
          <LegalValue label="Téléphone" value={contact.phone} />
        </LegalSection>

        <LegalSection title="Directeur de la publication">
          <LegalValue label="Responsable" value={legal.publicationDirector} />
        </LegalSection>

        <LegalSection title="Hébergeur du site">
          <p>
            Le présent site est hébergé par {host.name}, {host.address}.
          </p>
          <p>
            Site web :{' '}
            <a
              href={host.website}
              className="text-primary hover:underline"
              rel="noreferrer noopener"
              target="_blank"
            >
              {host.website}
            </a>
          </p>
        </LegalSection>

        <LegalSection title="Propriété intellectuelle">
          <p>
            L’ensemble des éléments composant ce site, incluant les textes, la charte
            graphique, la structure et le code source, est protégé par le droit d’auteur.
            Toute reproduction ou représentation, totale ou partielle, sans autorisation
            écrite préalable est interdite.
          </p>
          <p>
            Les sites réalisés pour nos clients demeurent leur propriété selon les
            conditions fixées au contrat et aux conditions générales de vente.
          </p>
        </LegalSection>

        <LegalSection title="Responsabilité">
          <p>
            {site.name} met en œuvre les moyens raisonnables pour assurer l’exactitude
            des informations publiées sur ce site. Ces informations sont fournies à titre
            indicatif et peuvent évoluer. Les tarifs affichés portant la mention « à
            partir de » constituent des points de départ et ne valent pas offre ferme :
            seul le devis accepté engage les parties.
          </p>
        </LegalSection>

        <LegalSection title="Données personnelles">
          <p>
            Le traitement des données personnelles collectées sur ce site est décrit dans
            notre{' '}
            <a href="/politique-confidentialite" className="text-primary hover:underline">
              politique de confidentialité
            </a>
            .
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
