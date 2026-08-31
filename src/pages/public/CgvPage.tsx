import { site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection } from '@/components/marketing/LegalPage';

/**
 * Conditions Générales de Vente (CGV) applicables aux prestations de création de sites internet,
 * d'hébergement, de maintenance et de services digitaux fournies par HBG Labs.
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
        updatedAt="2026-08-31"
        requiresLegalIdentity
      >
        <LegalSection title="1. Objet et champ d’application">
          <p>
            Les présentes Conditions Générales de Vente (ci-après les «&nbsp;CGV&nbsp;») s’appliquent à
            l’ensemble des prestations de services numériques proposées par l’entreprise individuelle{' '}
            <strong className="font-medium text-foreground">{site.legalName}</strong> (SIREN {site.legal.siren}),
            notamment la conception et le développement de sites web, l’hébergement managé, la gestion des
            noms de domaine, ainsi que la maintenance préventive, corrective et évolutive.
          </p>
          <p className="mt-2">
            Toute commande de prestation ou souscription à un abonnement implique l’adhésion pleine et
            entière du client aux présentes CGV, qui prévalent sur tout autre document ou conditions
            d’achat du client.
          </p>
        </LegalSection>

        <LegalSection title="2. Devis, commande et formation du contrat">
          <p>
            Les prix figurant sur le site public sont donnés à titre indicatif («&nbsp;à partir de&nbsp;»)
            et ne constituent pas une offre ferme.
          </p>
          <p className="mt-2">
            Chaque prestation personnalisée de création ou refonte de site fait l’objet d’un devis préalable
            écrit détaillant le cahier des charges, le périmètre fonctionnel, le planning estimatif et le
            montant de la prestation.
          </p>
          <p className="mt-2">
            Le devis est valable pendant une durée de trente (30) jours à compter de sa date d’émission. Le
            contrat est valablement formé dès lors que le devis est retourné signé et accepté par le client
            (ou validé par voie électronique), accompagné du règlement de l’acompte stipulé.
          </p>
        </LegalSection>

        <LegalSection title="3. Collaboration et obligations du client">
          <p>
            La réalisation d’un site web nécessite une collaboration active entre le client et HBG Labs.
            Le client s’engage à :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li>Fournir dans les délais impartis l’ensemble des éléments nécessaires à la réalisation (textes, visuels haute définition, logos, chartes graphiques, mentions légales spécifiques).</li>
            <li>Garantir qu’il est titulaire des droits de propriété intellectuelle sur tous les éléments transmis à HBG Labs et dégager HBG Labs de toute responsabilité en cas d’action en contrefaçon intentée par un tiers.</li>
            <li>Désigner un interlocuteur unique décisionnaire pour la validation des étapes de conception et de recette.</li>
            <li>Répondre aux demandes de validation sous cinq (5) jours ouvrés afin de ne pas décaler le calendrier convenu.</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Recette, livraison et mise en ligne">
          <p>
            À l’issue de la phase de développement, le site est mis à disposition du client sur un
            environnement sécurisé de préproduction afin de procéder à la phase de recette.
          </p>
          <p className="mt-2">
            Le client dispose d’un délai de dix (10) jours ouvrés pour formuler par écrit ses éventuelles
            réserves portant sur la conformité du livrable par rapport au devis accepté. À défaut de réserves
            notifiées dans ce délai, la recette est réputée prononcée sans réserve et le site peut être basculé
            en production après complet paiement du solde de la prestation de création.
          </p>
        </LegalSection>

        <LegalSection title="5. Tarifs, abonnements récurrents et modalités de paiement">
          <p>
            Les tarifs des prestations de création et des forfaits d’hébergement et de maintenance sont
            indiqués en euros (€), hors taxes (TVA non applicable conformément à l’article 293 B du CGI, ou
            majorés de la TVA au taux légal en vigueur si assujettissement).
          </p>
          <p className="mt-2">
            Les prestations d’hébergement et de maintenance continue font l’objet d’un abonnement mensuel à
            échéance récurrente, prélevé de manière automatique par carte bancaire via le prestataire de
            paiement sécurisé Stripe à date anniversaire.
          </p>
          <p className="mt-2">
            En cas de rejet de prélèvement, le client est automatiquement notifié et dispose d’un délai de
            quinze (15) jours pour régulariser sa situation. À défaut de régularisation dans ce délai, HBG Labs
            se réserve le droit de suspendre temporairement l’accès à l’hébergement et aux services associés
            jusqu’au paiement intégral des sommes dues.
          </p>
        </LegalSection>

        <LegalSection title="6. Droit de rétractation">
          <p>
            Pour les clients professionnels, les dispositions relatives au droit de rétractation du Code de
            la consommation ne sont pas applicables, sauf dans les conditions très strictes prévues par
            l’article L. 221-3 du Code de la consommation (contrats conclus hors établissement pour les
            entreprises de moins de cinq salariés et dont l’objet n’entre pas dans le champ principal de leur
            activité).
          </p>
          <p className="mt-2">
            Lorsque la prestation est commandée par un consommateur ou un non-professionnel, celui-ci dispose
            d’un délai de quatorze (14) jours pour exercer son droit de rétractation à compter de la conclusion
            du contrat. Toutefois, si le client demande expressément le commencement d’exécution des services
            avant l’expiration de ce délai, il renonce expressément à son droit de rétractation pour les
            prestations pleinement exécutées conformément à l’article L. 221-28 du Code de la consommation.
          </p>
        </LegalSection>

        <LegalSection title="7. Durée, tacite reconduction et résiliation de l’abonnement">
          <p>
            Les abonnements mensuels d’hébergement et de maintenance sont conclus sans engagement de durée et
            se renouvellent automatiquement de mois en mois par tacite reconduction.
          </p>
          <p className="mt-2">
            Le client peut résilier son abonnement à tout moment directement depuis son espace client ou par
            courrier électronique adressé à HBG Labs. La résiliation prend effet à l’issue de la période
            mensuelle en cours déjà réglée. Aucun remboursement prorata temporis du mois entamé n’est effectué.
          </p>
        </LegalSection>

        <LegalSection title="8. Réversibilité et restitution des données">
          <p>
            À la cessation des relations contractuelles pour quelque cause que ce soit, HBG Labs s’engage à
            restituer au client, sur simple demande écrite formulée dans un délai de trente (30) jours suivant
            la fin du contrat :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li>L’ensemble des contenus, médias et textes appartenant au client.</li>
            <li>Le code source des développements spécifiques réalisés pour son compte.</li>
            <li>Les codes d’autorisation de transfert (Auth-Code) pour les noms de domaine gérés.</li>
          </ul>
        </LegalSection>

        <LegalSection title="9. Propriété intellectuelle et transfert des droits">
          <p>
            Le transfert de propriété intellectuelle sur les créations graphiques et développements
            spécifiques réalisés sur mesure pour le client est subordonné au paiement intégral du prix convenu
            au devis.
          </p>
          <p className="mt-2">
            HBG Labs conserve l’entière propriété de ses méthodes, bibliothèques, savoir-faire, composants
            génériques réutilisables et frameworks techniques ayant servi à la réalisation du projet.
          </p>
          <p className="mt-2">
            Sauf refus exprès formulé par écrit, le client autorise HBG Labs à mentionner la réalisation du
            site web à titre de référence commerciale sur son site internet et ses supports promotionnels.
          </p>
        </LegalSection>

        <LegalSection title="10. Responsabilité et garanties">
          <p>
            HBG Labs est tenue à une obligation de moyens pour l’ensemble des prestations exécutées.
          </p>
          <p className="mt-2">
            La responsabilité de HBG Labs ne saurait être engagée pour des dommages indirects tels que perte de
            chiffre d’affaires, manque à gagner, préjudice d’image ou perte d’exploitation. En tout état de
            cause, si la responsabilité de HBG Labs devait être retenue, le montant total des indemnités ne
            pourra excéder les sommes effectivement perçues par HBG Labs au titre du contrat au cours des douze
            (12) derniers mois.
          </p>
        </LegalSection>

        <LegalSection title="11. Droit applicable et règlement des différends">
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, les parties s’engagent à
            rechercher en priorité une solution amiable. À défaut d’accord amiable dans un délai de trente (30)
            jours à compter de la notification du litige, celui-ci sera soumis aux tribunaux compétents dans le
            ressort du tribunal de commerce de Fort-de-France.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
