import { site } from '@/config/site';
import { env } from '@/lib/env';

/**
 * Métadonnées de page (§41).
 *
 * React 19 remonte lui-même les balises `<title>`, `<meta>` et `<link>` vers
 * le `<head>`, où qu'elles soient rendues dans l'arbre. Aucune bibliothèque
 * tierce n'est nécessaire.
 *
 * Limite à connaître : ce site est une application monopage. Les robots qui
 * n'exécutent pas JavaScript ne voient que le `<head>` de `index.html`.
 * Googlebot exécute JavaScript et lit donc ces balises ; les aperçus de
 * partage de plusieurs réseaux sociaux, non. Le rendu statique des pages
 * publiques est la réponse durable, il relève d'un lot ultérieur.
 */

export interface SeoProps {
  /** Titre de la page, sans le nom du site : il est ajouté ici. */
  title: string;
  description: string;
  /** Chemin canonique, par exemple « /tarifs ». */
  path: string;
  /** `noindex` pour les pages sans valeur de référencement. */
  noIndex?: boolean;
  /**
   * Données structurées schema.org, sérialisées en JSON-LD.
   *
   * Plusieurs blocs sont acceptés : une page peut décrire à la fois
   * l'établissement et sa foire aux questions. Les moteurs lisent chaque
   * balise `application/ld+json` indépendamment.
   */
  structuredData?: Record<string, unknown> | readonly Record<string, unknown>[];
}

export function Seo({ title, description, path, noIndex = false, structuredData }: SeoProps) {
  const fullTitle = `${title} | ${site.name}`;
  const canonical = new URL(path, env.VITE_APP_URL).toString();

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content="fr_FR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {structuredData &&
        (Array.isArray(structuredData) ? structuredData : [structuredData]).map(
          (block, index) => (
            <script
              key={index}
              type="application/ld+json"
            >
              {JSON.stringify(block)}
            </script>
          ),
        )}
    </>
  );
}
