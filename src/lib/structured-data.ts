import { site } from '@/config/site';
import { env } from '@/lib/env';

/**
 * Données structurées schema.org (§41).
 *
 * Dans un module distinct de `Seo.tsx` : un fichier exportant autre chose que
 * des composants désactive le rafraîchissement à chaud de React pour tout le
 * fichier.
 */

/**
 * Fiche d'établissement pour les moteurs de recherche.
 *
 * Les champs absents de la configuration sont omis plutôt que remplis. Une
 * donnée structurée inexacte se retourne contre le référencement : Google
 * sanctionne les incohérences entre le balisage et le contenu visible de la
 * page.
 */
export function localBusinessSchema(): Record<string, unknown> {
  const { legal, contact } = site;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.name,
    description: site.positioning,
    url: env.VITE_APP_URL,
    areaServed: { '@type': 'Place', name: site.area },
    serviceType: [
      'Création de site web',
      'Hébergement de site web',
      'Maintenance de site web',
    ],
  };

  if (site.legalName) schema.legalName = site.legalName;
  if (contact.email) schema.email = contact.email;
  if (contact.phone) schema.telephone = contact.phone;

  if (legal.address.line1 && legal.address.city) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: legal.address.line1,
      postalCode: legal.address.postalCode,
      addressLocality: legal.address.city,
      addressCountry: 'FR',
    };
  }

  return schema;
}

/**
 * Balisage de foire aux questions.
 *
 * Rend les réponses éligibles à l'affichage enrichi dans les résultats de
 * recherche. Le balisage doit refléter exactement le contenu visible : Google
 * pénalise les questions présentes dans le balisage mais absentes de la page.
 */
export function faqSchema(
  items: readonly { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
