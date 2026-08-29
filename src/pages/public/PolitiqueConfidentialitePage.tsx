import { site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection } from '@/components/marketing/LegalPage';

/**
 * Politique de confidentialité (RGPD).
 *
 * Le contenu décrit le traitement réellement mis en œuvre par la plateforme,
 * établi d'après le schéma de base de données : les tables `quote_requests` et
 * `contact_messages` pour les formulaires publics, `profiles`, `organizations`
 * et les tables métier pour l'espace client.
 *
 * Aucune mention de cookie de mesure d'audience : le site n'en dépose aucun. La
 * session Supabase utilise le stockage local du navigateur, ce qui relève d'un
 * fonctionnement strictement nécessaire et ne demande pas de consentement.
 */
export function PolitiqueConfidentialitePage() {
  return (
    <>
      <Seo
        title="Politique de confidentialité"
        description="Comment HBG Labs collecte, utilise et protège vos données personnelles, conformément au RGPD."
        path="/politique-confidentialite"
      />

      <LegalPage
        title="Politique de confidentialité"
        updatedAt="2026-08-28"
        requiresLegalIdentity
      >
        <LegalSection title="Responsable du traitement">
          <p>
            {site.legalName || site.name} détermine les finalités et les moyens des
            traitements décrits ci-dessous. Les coordonnées figurent dans les{' '}
            <a href="/mentions-legales" className="text-primary hover:underline">
              mentions légales
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="Données collectées et finalités">
          <p>Nous collectons uniquement les données nécessaires à chaque usage.</p>

          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-sm">
              <caption className="sr-only">
                Données collectées, finalités et bases légales
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">Contexte</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Données</th>
                  <th scope="col" className="py-2 font-medium">Base légale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    Formulaire de devis
                  </th>
                  <td className="py-3 pr-4">
                    Nom, adresse électronique, téléphone, entreprise, description du
                    projet
                  </td>
                  <td className="py-3">Mesures précontractuelles</td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    Formulaire de contact
                  </th>
                  <td className="py-3 pr-4">
                    Nom, adresse électronique, téléphone, objet et message
                  </td>
                  <td className="py-3">Intérêt légitime à répondre</td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    Compte client
                  </th>
                  <td className="py-3 pr-4">
                    Identité, adresse électronique, informations de l’entreprise
                  </td>
                  <td className="py-3">Exécution du contrat</td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    Facturation
                  </th>
                  <td className="py-3 pr-4">
                    Montants, dates, marque et quatre derniers chiffres du moyen de
                    paiement
                  </td>
                  <td className="py-3">Obligation légale et contrat</td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    Journal de sécurité
                  </th>
                  <td className="py-3 pr-4">
                    Connexions, actions sensibles, adresse IP
                  </td>
                  <td className="py-3">Intérêt légitime à la sécurité</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Nous ne conservons aucune donnée bancaire. Les numéros de carte sont traités
            directement par notre prestataire de paiement et ne transitent jamais par nos
            serveurs. Seuls la marque et les quatre derniers chiffres sont enregistrés,
            afin que vous puissiez reconnaître le moyen de paiement utilisé.
          </p>
        </LegalSection>

        <LegalSection title="Durées de conservation">
          <ul className="list-inside list-disc space-y-1.5">
            <li>Demandes de devis et messages de contact : trois ans après le dernier contact.</li>
            <li>Données de compte client : durée de la relation contractuelle, puis trois ans.</li>
            <li>Pièces comptables et factures : dix ans, conformément au code de commerce.</li>
            <li>Journaux de sécurité : un an.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Destinataires et sous-traitants">
          <p>
            Vos données ne sont ni vendues ni cédées. Elles sont traitées par les
            prestataires techniques suivants, dans la limite de leur mission.
          </p>

          <ul className="mt-2 space-y-2">
            {site.processors.map((processor) => (
              <li key={processor.name}>
                <span className="font-medium text-foreground">{processor.name}</span> :{' '}
                {processor.purpose}. Hébergement des traitements : {processor.location}.
              </li>
            ))}
          </ul>

          <p>
            Les transferts vers les États-Unis reposent sur les clauses contractuelles
            types de la Commission européenne et, le cas échéant, sur la certification
            des prestataires au cadre de protection des données UE/États-Unis.
          </p>
        </LegalSection>

        <LegalSection title="Cookies et stockage local">
          <p>
            Ce site ne dépose aucun cookie publicitaire ni aucun outil de mesure
            d’audience tiers. Aucune bannière de consentement n’est donc nécessaire.
          </p>
          <p>
            L’espace client utilise le stockage local de votre navigateur pour maintenir
            votre session ouverte. Ce mécanisme est strictement nécessaire au
            fonctionnement du service. Vider les données de votre navigateur vous
            déconnecte.
          </p>
        </LegalSection>

        <LegalSection title="Sécurité">
          <p>
            L’accès aux données est cloisonné au niveau de la base de données : chaque
            organisation cliente ne peut accéder qu’à ses propres enregistrements, et
            cette séparation est vérifiée par une suite de tests automatisés à chaque
            évolution. Les échanges sont chiffrés en HTTPS.
          </p>
        </LegalSection>

        <LegalSection title="Vos droits">
          <p>
            Vous disposez d’un droit d’accès, de rectification, d’effacement, de
            limitation, d’opposition et de portabilité sur vos données. Pour l’exercer,
            écrivez-nous à l’adresse figurant dans les mentions légales, en justifiant de
            votre identité.
          </p>
          <p>
            Nous répondons sous un mois. Si la réponse ne vous satisfait pas, vous pouvez
            saisir la Commission nationale de l’informatique et des libertés (CNIL),
            3 place de Fontenoy, 75007 Paris.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
