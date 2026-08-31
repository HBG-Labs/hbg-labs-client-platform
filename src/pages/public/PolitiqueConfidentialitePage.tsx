import { site, formattedAddress } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection } from '@/components/marketing/LegalPage';

/**
 * Politique de confidentialité conforme au Règlement Général sur la Protection
 * des Données (RGPD - Règlement UE 2016/679) et à la loi Informatique et Libertés.
 */
export function PolitiqueConfidentialitePage() {
  return (
    <>
      <Seo
        title="Politique de confidentialité"
        description="Comment HBG Labs collecte, traite et protège vos données personnelles conformément au RGPD et à la législation française."
        path="/politique-confidentialite"
      />

      <LegalPage
        title="Politique de confidentialité"
        updatedAt="2026-08-31"
        requiresLegalIdentity
      >
        <LegalSection title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données à caractère personnel collectées sur ce site
            est l’entreprise individuelle <strong className="font-medium text-foreground">{site.legalName}</strong>,
            dont le siège social est situé à {formattedAddress()} (SIREN {site.legal.siren}).
          </p>
          <p className="mt-2">
            Pour toute question relative à la gestion de vos données ou pour exercer vos droits,
            vous pouvez contacter notre référent protection des données par courrier électronique à l’adresse :{' '}
            <a href={`mailto:${site.contact.dpoEmail}`} className="text-primary hover:underline">
              {site.contact.dpoEmail}
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="2. Données collectées, finalités et bases légales">
          <p>
            HBG Labs applique le principe de minimisation des données : nous ne collectons que les
            informations strictement nécessaires à l’exécution de nos services, au respect de nos
            obligations légales ou à la poursuite de nos intérêts légitimes.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Tableau des traitements de données personnelles
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Traitement</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Données collectées</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Finalité principale</th>
                  <th scope="col" className="py-2.5 font-semibold">Base légale (RGPD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                    Demande de devis
                  </th>
                  <td className="py-3 pr-4 text-muted">
                    Nom, prénom, adresse e-mail, téléphone, nom de l’entreprise, périmètre du projet, budget estimatif
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    Étude de faisabilité et élaboration d’une proposition commerciale
                  </td>
                  <td className="py-3 text-muted">
                    Mesures précontractuelles (Art. 6.1.b)
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                    Formulaire de contact
                  </th>
                  <td className="py-3 pr-4 text-muted">
                    Nom, prénom, adresse e-mail, téléphone, objet, contenu du message
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    Traitement des demandes d’information et support commercial
                  </td>
                  <td className="py-3 text-muted">
                    Intérêt légitime à répondre (Art. 6.1.f)
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                    Compte client & Accès SaaS
                  </th>
                  <td className="py-3 pr-4 text-muted">
                    Nom, prénom, adresse e-mail, organisation de rattachement, rôle plateforme
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    Authentification sécurisée et accès à l’espace de gestion client
                  </td>
                  <td className="py-3 text-muted">
                    Exécution du contrat (Art. 6.1.b)
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                    Gestion des tickets & Demandes
                  </th>
                  <td className="py-3 pr-4 text-muted">
                    Titre du ticket, messages d’échanges, pièces jointes, identifiant d’auteur
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    Suivi de maintenance, évolutions de sites et support technique
                  </td>
                  <td className="py-3 text-muted">
                    Exécution du contrat (Art. 6.1.b)
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                    Facturation & Abonnements
                  </th>
                  <td className="py-3 pr-4 text-muted">
                    Montants facturés, dates, identifiants de transactions Stripe, marque et 4 derniers chiffres de carte
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    Gestion des abonnements d’hébergement/maintenance et comptabilité
                  </td>
                  <td className="py-3 text-muted">
                    Obligation légale (Art. 6.1.c) & Contrat (Art. 6.1.b)
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-normal text-foreground">
                    Journal d’audit & Sécurité
                  </th>
                  <td className="py-3 pr-4 text-muted">
                    Adresse IP, horodatage, action réalisée, identifiant de compte
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    Prévention des fraudes, détection des intrusions et traçabilité
                  </td>
                  <td className="py-3 text-muted">
                    Intérêt légitime & Obligation légale (Art. 6.1.f & c)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
            <strong className="font-medium text-foreground">Sécurité des données bancaires :</strong>{' '}
            HBG Labs ne conserve, n’enregistre et ne traite directement aucune coordonnée bancaire complète (numéro de carte, date d’expiration ou cryptogramme CVV). L’ensemble des opérations de paiement est opéré par Stripe Payments Europe Ltd, établissement certifié PCI-DSS Niveau 1.
          </div>
        </LegalSection>

        <LegalSection title="3. Durées de conservation des données">
          <p>
            Vos données personnelles sont conservées uniquement pendant la durée nécessaire aux
            finalités poursuivies, augmentée des délais légaux de prescription :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted">
            <li>
              <strong className="font-medium text-foreground">Demandes de devis et messages de contact :</strong>{' '}
              conservés pendant 3 ans à compter du dernier contact émanant du prospect.
            </li>
            <li>
              <strong className="font-medium text-foreground">Données de compte client et tickets :</strong>{' '}
              conservées pendant toute la durée de la relation contractuelle, puis archivées pendant 3 ans à des fins probatoires.
            </li>
            <li>
              <strong className="font-medium text-foreground">Factures et pièces comptables :</strong>{' '}
              conservées pendant 10 ans conformément aux obligations légales de l’article L.123-22 du Code de commerce.
            </li>
            <li>
              <strong className="font-medium text-foreground">Journaux de sécurité et d’audit :</strong>{' '}
              conservés pendant 1 an à compter de leur enregistrement.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Destinataires et sous-traitants ultérieurs">
          <p>
            Les données collectées sont destinées à l’usage exclusif de HBG Labs. Elles ne sont
            jamais vendues, louées ou cédées à des tiers à des fins commerciales ou publicitaires.
          </p>
          <p className="mt-2">
            Dans le cadre du fonctionnement technique de la plateforme, nous faisons appel à des
            prestataires sous-traitants rigoureusement sélectionnés :
          </p>

          <div className="mt-4 space-y-3">
            {site.processors.map((processor) => (
              <div key={processor.name} className="rounded-md border border-border bg-surface p-3.5 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-foreground">{processor.name}</span>
                  <span className="text-xs text-muted">Localisation : {processor.location}</span>
                </div>
                <p className="mt-1 text-muted">{processor.purpose}</p>
                <p className="mt-1 text-xs text-primary">Garantie : {processor.transferMechanism}</p>
              </div>
            ))}
          </div>
        </LegalSection>

        <LegalSection title="5. Cookies et technologies de stockage local">
          <p>
            Le site public de HBG Labs ne dépose <strong>aucun cookie publicitaire, marketing ou de pistage tiers</strong>.
          </p>
          <p className="mt-2">
            La plateforme utilise uniquement des mécanismes de stockage local (<code className="rounded bg-muted/20 px-1 py-0.5 text-xs font-mono">localStorage</code>) strictement nécessaires à l’authentification de l’espace client et à la mémorisation de vos préférences d’affichage.
          </p>
          <p className="mt-2">
            Pour plus de détails, consultez notre{' '}
            <a href="/cookies" className="text-primary hover:underline">
              Politique relative aux cookies et traceurs
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="6. Vos droits et modalités d’exercice">
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés modifiée, vous disposez des
            droits suivants sur vos données personnelles :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li><strong className="font-medium text-foreground">Droit d’accès (Art. 15) :</strong> obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie.</li>
            <li><strong className="font-medium text-foreground">Droit de rectification (Art. 16) :</strong> faire corriger des données inexactes ou incomplètes.</li>
            <li><strong className="font-medium text-foreground">Droit à l’effacement / droit à l’oubli (Art. 17) :</strong> demander la suppression de vos données lorsqu’un motif légal est satisfait.</li>
            <li><strong className="font-medium text-foreground">Droit à la limitation (Art. 18) :</strong> demander le gel temporaire du traitement de certaines données.</li>
            <li><strong className="font-medium text-foreground">Droit à la portabilité (Art. 20) :</strong> recevoir vos données dans un format structuré et lisible par machine (export JSON disponible dans votre espace client).</li>
            <li><strong className="font-medium text-foreground">Droit d’opposition (Art. 21) :</strong> vous opposer à tout moment au traitement basé sur notre intérêt légitime.</li>
            <li><strong className="font-medium text-foreground">Directives post-mortem (Art. 85 loi Informatique et Libertés) :</strong> définir des directives relatives au sort de vos données après votre décès.</li>
          </ul>

          <p className="mt-4">
            Pour exercer l’un de ces droits, vous pouvez nous adresser votre demande par courrier électronique à{' '}
            <a href={`mailto:${site.contact.dpoEmail}`} className="text-primary hover:underline font-medium">
              {site.contact.dpoEmail}
            </a>
            . Nous nous engageons à vous répondre dans un délai maximal de 30 jours à compter de la réception de votre demande.
          </p>
          <p className="mt-2 text-sm text-muted">
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous
            avez la possibilité d’introduire une réclamation auprès de l’autorité de contrôle compétente : la{' '}
            <strong className="text-foreground">CNIL</strong> (Commission Nationale de l’Informatique et des Libertés) — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 (site web :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
              cnil.fr
            </a>
            ).
          </p>
        </LegalSection>

        <LegalSection title="7. Mesures de sécurité techniques et organisationnelles">
          <p>
            HBG Labs met en œuvre des mesures de sécurité rigoureuses pour préserver l’intégrité, la
            confidentialité et la disponibilité de vos données :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li>Chiffrement systématique de tous les flux réseau en transit via le protocole TLS/HTTPS (HSTS activé).</li>
            <li>Politiques d’isolation strictes au niveau de la base de données PostgreSQL (Row Level Security appliquée et forcée).</li>
            <li>Cloisonnement étanche des accès : les membres d’une organisation cliente ne peuvent en aucun cas accéder aux données d’une autre organisation.</li>
            <li>Journalisation d’audit des connexions et des modifications d’accès.</li>
            <li>Tests automatisés continus de non-régression et de sécurité.</li>
          </ul>
        </LegalSection>
      </LegalPage>
    </>
  );
}
