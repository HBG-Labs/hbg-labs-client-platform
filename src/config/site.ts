/**
 * Identité du site public et informations légales.
 *
 * Point unique de vérité pour tout ce qui identifie HBG Labs : nom, baseline,
 * coordonnées, mentions légales. Aucune de ces valeurs ne doit être écrite en
 * dur dans un composant.
 *
 *
 * VALEURS MANQUANTES
 *
 * Plusieurs champs légaux restent vides parce que l'information n'est pas
 * connue. Ils ne sont pas remplis par des valeurs plausibles : un SIRET
 * inventé sur une page de mentions légales est une fausse déclaration, et le
 * visiteur n'a aucun moyen de repérer la substitution.
 *
 * Les pages légales détectent l'absence via `missingLegalFields()` et affichent
 * un avertissement explicite à la place du contenu concerné.
 */

export interface SiteConfig {
  readonly name: string;
  readonly legalName: string;
  readonly positioning: string;
  readonly headline: string;
  readonly area: string;
  readonly contact: {
    readonly email: string;
    readonly phone: string;
  };
  readonly legal: {
    readonly legalForm: string;
    readonly siret: string;
    readonly vatNumber: string;
    readonly shareCapital: string;
    readonly publicationDirector: string;
    readonly address: {
      readonly line1: string;
      readonly postalCode: string;
      readonly city: string;
      readonly country: string;
    };
  };
  readonly host: {
    readonly name: string;
    readonly address: string;
    readonly website: string;
  };
  readonly processors: readonly {
    readonly name: string;
    readonly purpose: string;
    readonly location: string;
  }[];
}

/**
 * Type explicite plutôt que `as const` sur l'objet.
 *
 * `as const` figerait chaque chaîne vide en type littéral `''`. TypeScript
 * réduirait alors `if (phone) { phone.replace(...) }` à `never` dans la branche
 * vraie, puisqu'une chaîne vide littérale ne peut pas être vraie. Le code
 * cesserait de compiler dès qu'un champ est renseigné plus tard.
 */
export const site: SiteConfig = {
  name: 'HBG Labs',
  legalName: '',

  /** Positionnement, §6. */
  positioning: 'HBG Labs crée, héberge et maintient votre présence digitale.',

  /** Message principal du hero, §6. */
  headline: 'Votre site web. Votre hébergement. Votre tranquillité.',

  /** Zone d'activité principale, utilisée par le référencement local (§41). */
  area: 'Martinique',

  contact: {
    /** Adresse de contact affichée publiquement. Vide = ligne masquée. */
    email: '',
    phone: '',
  },

  /** Informations légales obligatoires (article 6 III de la LCEN). */
  legal: {
    /** Forme juridique, par exemple « SASU » ou « Entreprise individuelle ». */
    legalForm: '',
    /** 14 chiffres. */
    siret: '',
    /** Numéro de TVA intracommunautaire, si assujetti. */
    vatNumber: '',
    /** Capital social, si société. */
    shareCapital: '',
    /** Directeur de la publication. */
    publicationDirector: '',
    address: {
      line1: '',
      postalCode: '',
      city: '',
      country: 'France',
    },
  },

  /** Hébergeur du site, à mentionner obligatoirement. */
  host: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    website: 'https://vercel.com',
  },

  /** Sous-traitants traitant des données personnelles (RGPD). */
  processors: [
    { name: 'Supabase', purpose: 'Hébergement de la base de données et authentification', location: 'Union européenne (Irlande)' },
    { name: 'Vercel', purpose: 'Hébergement et diffusion du site', location: 'États-Unis' },
    { name: 'Stripe', purpose: 'Traitement des paiements et facturation', location: 'États-Unis' },
    { name: 'Resend', purpose: 'Envoi des courriels transactionnels', location: 'États-Unis' },
    { name: 'Sentry', purpose: 'Supervision technique des erreurs de l’application, sans donnée personnelle', location: 'États-Unis' },
  ],
};

/** Champ légal manquant, avec l'intitulé à demander. */
export interface MissingLegalField {
  readonly key: string;
  readonly label: string;
}

/**
 * Champs légaux non renseignés.
 *
 * Les pages `/mentions-legales` et `/cgv` s'en servent pour signaler une
 * publication incomplète plutôt que d'afficher un contenu inexact.
 */
export function missingLegalFields(): MissingLegalField[] {
  const missing: MissingLegalField[] = [];
  const { legal, contact } = site;

  if (!site.legalName) missing.push({ key: 'legalName', label: 'Dénomination sociale' });
  if (!legal.legalForm) missing.push({ key: 'legalForm', label: 'Forme juridique' });
  if (!legal.siret) missing.push({ key: 'siret', label: 'Numéro SIRET' });
  if (!legal.publicationDirector) {
    missing.push({ key: 'publicationDirector', label: 'Directeur de la publication' });
  }
  if (!legal.address.line1 || !legal.address.city) {
    missing.push({ key: 'address', label: 'Adresse du siège social' });
  }
  if (!contact.email) missing.push({ key: 'email', label: 'Adresse de contact' });

  return missing;
}

/** Adresse postale formatée, vide si incomplète. */
export function formattedAddress(): string {
  const { line1, postalCode, city, country } = site.legal.address;
  if (!line1 || !city) return '';
  return [line1, [postalCode, city].filter(Boolean).join(' '), country]
    .filter(Boolean)
    .join(', ');
}
