import { site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { LegalPage, LegalSection } from '@/components/marketing/LegalPage';

/**
 * Conditions générales de vente.
 *
 * Le texte décrit le fonctionnement réel de la plateforme : abonnement mensuel
 * prélevé par Stripe, hébergement lié à l'abonnement, demandes de modification
 * traitées par tickets.
 *
 * Il engage juridiquement HBG Labs et demande une relecture par un
 * professionnel du droit avant mise en ligne. L'encart d'avertissement le
 * signale explicitement plutôt que de laisser croire à un document validé.
 */
export function CgvPage() {
  return (
    <>
      <Seo
        title="Conditions générales de vente"
        description="Conditions générales de vente applicables aux prestations de création, d’hébergement et de maintenance de sites web de HBG Labs."
        path="/cgv"
        noIndex
      />

      <LegalPage
        title="Conditions générales de vente"
        updatedAt="2026-08-28"
        requiresLegalIdentity
      >
        <Alert tone="warning" title="Document en cours de finalisation" className="mb-10">
          <p>
            Ce texte décrit le fonctionnement des prestations tel qu’il est implémenté
            dans la plateforme. Il doit être relu et validé par un professionnel du droit
            avant la mise en ligne publique du site.
          </p>
        </Alert>

        <LegalSection title="1. Objet">
          <p>
            Les présentes conditions régissent les prestations de création, d’hébergement
            et de maintenance de sites web fournies par {site.legalName || site.name} à
            ses clients professionnels. Toute commande implique leur acceptation sans
            réserve.
          </p>
        </LegalSection>

        <LegalSection title="2. Devis et formation du contrat">
          <p>
            Les tarifs publiés sur le site sont indicatifs. Ceux portant la mention « à
            partir de » constituent un point de départ et ne valent pas offre ferme.
          </p>
          <p>
            Chaque prestation de création fait l’objet d’un devis détaillant le
            périmètre, le calendrier et le montant. Le contrat est formé à l’acceptation
            écrite du devis par le client. Le devis est valable trente jours.
          </p>
        </LegalSection>

        <LegalSection title="3. Obligations du client">
          <p>
            Le client fournit les contenus nécessaires à la réalisation : textes, images,
            logo et informations légales. Il garantit détenir les droits d’usage de ces
            éléments et garantit {site.name} contre toute réclamation à ce titre.
          </p>
          <p>
            Les délais annoncés supposent une réponse du client sous cinq jours ouvrés à
            chaque demande de validation. Un retard de validation décale le calendrier
            d’autant.
          </p>
        </LegalSection>

        <LegalSection title="4. Recette et livraison">
          <p>
            Le site est mis à disposition sur une adresse de préproduction. Le client
            dispose de dix jours ouvrés pour signaler les anomalies. Passé ce délai sans
            retour, la recette est réputée acceptée et le site est mis en production.
          </p>
        </LegalSection>

        <LegalSection title="5. Abonnement, prix et paiement">
          <p>
            L’hébergement et, selon l’offre souscrite, la maintenance font l’objet d’un
            abonnement mensuel. Les montants sont exprimés hors taxes et majorés de la
            taxe applicable.
          </p>
          <p>
            Le prélèvement est opéré mensuellement par notre prestataire de paiement, à
            date anniversaire de la souscription. Le client gère son moyen de paiement et
            accède à ses factures depuis son espace client.
          </p>
          <p>
            En cas d’échec de prélèvement, le client est informé et dispose de quinze
            jours pour régulariser. Passé ce délai, l’accès au service peut être suspendu
            après information préalable.
          </p>
        </LegalSection>

        <LegalSection title="6. Durée et résiliation">
          <p>
            L’abonnement est conclu sans engagement de durée et se renouvelle par tacite
            reconduction mensuelle. Chacune des parties peut y mettre fin à tout moment
            depuis l’espace client ou par écrit, avec effet à l’échéance de la période en
            cours.
          </p>
          <p>
            À la résiliation, l’hébergement cesse à l’échéance de la période payée et le
            site n’est plus accessible. Le code source et les contenus sont remis au
            client sur demande formulée dans les trente jours. Le nom de domaine, enregistré
            au nom du client, lui reste acquis.
          </p>
        </LegalSection>

        <LegalSection title="7. Maintenance et demandes de modification">
          <p>
            Les offres incluant la maintenance couvrent les mises à jour techniques, les
            sauvegardes et les corrections d’anomalies. Les demandes de modification de
            contenu sont adressées via l’espace client et traitées dans les limites
            prévues par l’offre souscrite.
          </p>
          <p>
            Une demande relevant d’un développement nouveau fait l’objet d’un devis
            distinct, soumis au client avant toute intervention.
          </p>
        </LegalSection>

        <LegalSection title="8. Disponibilité">
          <p>
            {site.name} met en œuvre les moyens raisonnables pour assurer la
            disponibilité des sites hébergés. La disponibilité dépend d’infrastructures
            tierces, et aucune garantie de disponibilité continue n’est consentie hors
            engagement de niveau de service souscrit séparément.
          </p>
          <p>
            Les interruptions programmées pour maintenance sont annoncées à l’avance
            lorsque leur durée le justifie.
          </p>
        </LegalSection>

        <LegalSection title="9. Propriété intellectuelle">
          <p>
            À complet paiement du prix, le client devient titulaire des droits d’usage
            sur les développements spécifiques réalisés pour son site. Les composants
            génériques, bibliothèques et savoir-faire de {site.name} demeurent sa
            propriété.
          </p>
        </LegalSection>

        <LegalSection title="10. Responsabilité">
          <p>
            La responsabilité de {site.name} est limitée aux dommages directs et
            plafonnée au montant des sommes versées par le client au titre des douze mois
            précédant le fait générateur. Les dommages indirects, notamment la perte
            d’exploitation ou de chiffre d’affaires, sont exclus.
          </p>
        </LegalSection>

        <LegalSection title="11. Données personnelles">
          <p>
            Le traitement des données personnelles est décrit dans notre{' '}
            <a href="/politique-confidentialite" className="text-primary hover:underline">
              politique de confidentialité
            </a>
            . Lorsque {site.name} traite des données pour le compte du client, un accord
            de sous-traitance est conclu conformément à l’article 28 du RGPD.
          </p>
        </LegalSection>

        <LegalSection title="12. Droit applicable et litiges">
          <p>
            Les présentes conditions sont soumises au droit français. En cas de
            différend, les parties recherchent une solution amiable avant toute action
            contentieuse. À défaut d’accord, le litige relève des tribunaux compétents.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
