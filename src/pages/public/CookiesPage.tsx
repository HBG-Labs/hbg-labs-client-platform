import { site } from '@/config/site';
import { Seo } from '@/components/Seo';
import { LegalPage, LegalSection } from '@/components/marketing/LegalPage';

/**
 * Politique relative aux cookies et aux technologies de stockage local,
 * conforme aux lignes directrices et recommandations de la CNIL.
 */
export function CookiesPage() {
  return (
    <>
      <Seo
        title="Politique des cookies"
        description="Information transparente sur l’absence de traceurs publicitaires et l’utilisation du stockage local par HBG Labs."
        path="/cookies"
      />

      <LegalPage
        title="Politique relative aux cookies et traceurs"
        updatedAt="2026-08-31"
        requiresLegalIdentity
      >
        <LegalSection title="1. Qu’est-ce qu’un cookie et une technologie de stockage local ?">
          <p>
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette ou
            smartphone) lors de la visite d’un site internet. Il permet au site de mémoriser des données
            sur votre visite (comme votre identifiant de session ou la langue choisie).
          </p>
          <p className="mt-2">
            Le stockage local (<code className="rounded bg-muted/20 px-1 py-0.5 text-xs font-mono">localStorage</code> /{' '}
            <code className="rounded bg-muted/20 px-1 py-0.5 text-xs font-mono">sessionStorage</code>) est une technologie
            web moderne permettant de conserver des informations directement dans votre navigateur de manière plus
            sécurisée et performante que les cookies traditionnels.
          </p>
        </LegalSection>

        <LegalSection title="2. Notre engagement : zéro traceur publicitaire ou intrusif">
          <p>
            Chez <strong className="font-medium text-foreground">{site.name}</strong>, nous respectons
            strictement votre vie privée et appliquons une politique de transparence totale :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted">
            <li><strong>Aucun cookie publicitaire ou de ciblage marketing</strong> n’est utilisé sur notre plateforme.</li>
            <li><strong>Aucun pixel de suivi tiers</strong> (Google Ads, Meta Pixel, TikTok, etc.) n’est injecté sur nos pages.</li>
            <li><strong>Aucun cookie tiers de revente ou de partage de données</strong> n’est activé.</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Tableau des technologies de stockage réellement utilisées">
          <p>
            Les seuls éléments conservés dans votre navigateur sont strictement nécessaires au
            fonctionnement applicatif et à votre expérience de navigation :
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Tableau des technologies de stockage local utilisées sur HBG Labs
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Nom de la clé</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Type</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Finalité exacte</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Durée</th>
                  <th scope="col" className="py-2.5 font-semibold">Statut légal (CNIL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="py-3 pr-4 font-mono text-xs font-normal text-foreground">
                    sb-*-auth-token
                  </th>
                  <td className="py-3 pr-4 text-muted">localStorage</td>
                  <td className="py-3 pr-4 text-muted">
                    Maintien de la session d’authentification sécurisée de l’espace client (GoTrue / Supabase)
                  </td>
                  <td className="py-3 pr-4 text-muted">Durée de la session active</td>
                  <td className="py-3 text-muted">
                    <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                      Strictement nécessaire
                    </span>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 pr-4 font-mono text-xs font-normal text-foreground">
                    hbg_hero_variant
                  </th>
                  <td className="py-3 pr-4 text-muted">localStorage</td>
                  <td className="py-3 pr-4 text-muted">
                    Mémorisation de la préférence d’affichage de la page d’accueil (mode Vidéo interactif ou Classique)
                  </td>
                  <td className="py-3 pr-4 text-muted">Persistant jusqu’au nettoyage manuel</td>
                  <td className="py-3 text-muted">
                    <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      Préférence d’interface
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </LegalSection>

        <LegalSection title="4. Pourquoi aucun bandeau intrusif n’est affiché ?">
          <p>
            Conformément aux recommandations de la CNIL et à l’article 82 de la loi Informatique et
            Libertés, les traceurs et stockages strictement nécessaires à la fourniture d’un service de
            communication en ligne expressément demandé par l’utilisateur (comme la connexion à son compte)
            ou servant uniquement à adapter l’affichage sont <strong>exemptés de recueil préalable de consentement</strong>.
          </p>
          <p className="mt-2">
            Puisque nous n’utilisons aucun outil de tracking ou de monétisation de vos données, nous ne
            vous imposons aucun bandeau publicitaire bloquant.
          </p>
        </LegalSection>

        <LegalSection title="5. Comment contrôler ou effacer vos données de navigation ?">
          <p>
            Vous conservez à tout moment la pleine maîtrise des données stockées dans votre navigateur.
            Vous pouvez vider votre cache et supprimer le stockage local en suivant la procédure correspondant
            à votre navigateur :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            <li><strong>Google Chrome :</strong> Paramètres &gt; Confidentialité et sécurité &gt; Effacer les données de navigation &gt; Cookies et données de sites.</li>
            <li><strong>Mozilla Firefox :</strong> Paramètres &gt; Vie privée et sécurité &gt; Cookies et données de sites &gt; Effacer les données.</li>
            <li><strong>Apple Safari :</strong> Réglages &gt; Safari &gt; Avancé &gt; Données de sites &gt; Tout supprimer.</li>
            <li><strong>Microsoft Edge :</strong> Paramètres &gt; Confidentialité, recherche et services &gt; Effacer les données de navigation.</li>
          </ul>
        </LegalSection>
      </LegalPage>
    </>
  );
}
