/**
 * Identité du site public et informations légales de HBG Labs.
 *
 * Point unique de vérité pour tout ce qui identifie HBG Labs : nom, baseline,
 * coordonnées, mentions légales et sous-traitants RGPD.
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
    readonly dpoEmail: string;
  };
  readonly legal: {
    readonly legalForm: string;
    readonly siret: string;
    readonly siren: string;
    readonly vatNumber: string;
    readonly shareCapital: string;
    readonly rcs: string;
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
    readonly transferMechanism: string;
  }[];
}

export const site: SiteConfig = {
  name: 'HBG Labs',
  legalName: 'HBG Labs',

  /** Positionnement */
  positioning: 'HBG Labs crée, héberge et maintient votre présence digitale.',

  /** Message principal du hero */
  headline: 'Votre site web. Votre hébergement. Votre tranquillité.',

  /** Zone d\'activité principale */
  area: 'Martinique',

  contact: {
    email: 'hbglabs@gmail.com',
    phone: '',
    dpoEmail: 'hbglabs@gmail.com',
  },

  /** Informations légales obligatoires (article 6 III de la LCEN) */
  legal: {
    legalForm: 'Entrepreneur individuel (EI)',
    siret: '10919844000017',
    siren: '109 198 440',
    vatNumber: 'TVA non applicable, art. 293 B du CGI',
    shareCapital: 'Non applicable (Entreprise individuelle)',
    rcs: 'RCS Fort-de-France',
    publicationDirector: 'Harry BERGOZ, Fondateur de HBG Labs',
    address: {
      line1: 'Durand',
      postalCode: '97212',
      city: 'Saint-Joseph',
      country: 'France',
    },
  },

  /** Hébergeur du site (Vercel Inc.) */
  host: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    website: 'https://vercel.com',
  },

  /** Sous-traitants traitant des données personnelles (RGPD Art. 28) */
  processors: [
    {
      name: 'Supabase Inc.',
      purpose: 'Hébergement de la base de données relationnelle PostgreSQL et gestion de l’authentification GoTrue',
      location: 'Union européenne (Irlande)',
      transferMechanism: 'Hébergement direct dans l’UE',
    },
    {
      name: 'Vercel Inc.',
      purpose: 'Hébergement de l’application web, réseau de distribution de contenu (CDN) et routage DNS',
      location: 'États-Unis / Réseau mondial Edge',
      transferMechanism: 'Clauses contractuelles types (CCT) & Cadre de protection des données UE/USA (DPF)',
    },
    {
      name: 'Stripe Payments Europe, Ltd. / Stripe Inc.',
      purpose: 'Traitement sécurisé des paiements récurrents, prélèvements et portail de facturation client',
      location: 'Union européenne (Irlande) / États-Unis',
      transferMechanism: 'Clauses contractuelles types (CCT) & Certification PCI-DSS Niveau 1',
    },
    {
      name: 'Resend Inc.',
      purpose: 'Envoi des courriels transactionnels de notifications de tickets et réinitialisation de mot de passe',
      location: 'États-Unis',
      transferMechanism: 'Clauses contractuelles types (CCT) & Accord de traitement des données (DPA)',
    },
    {
      name: 'Sentry (Functional Software Inc.)',
      purpose: 'Supervision technique et détection des erreurs logicielles (anonymisée, sans identifiants ni données personnelles)',
      location: 'États-Unis',
      transferMechanism: 'Clauses contractuelles types (CCT) & PII désactivée (sendDefaultPii: false)',
    },
  ],
};

/** Champ légal manquant, avec l'intitulé à demander. */
export interface MissingLegalField {
  readonly key: string;
  readonly label: string;
}

/**
 * Vérification des champs légaux obligatoires.
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
