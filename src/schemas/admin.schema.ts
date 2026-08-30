import { z } from 'zod';

/**
 * Validation des formulaires d'administration.
 *
 * Ces schémas reproduisent les contraintes CHECK des migrations 02, 05 et 06.
 * Comme pour les formulaires publics, `optionalText` normalise le vide en
 * `undefined` : une chaîne vide envoyée sur une colonne facultative viole sa
 * contrainte de longueur minimale et fait échouer l'écriture.
 */

function optionalText(min: number, max: number, tooShort: string, tooLong: string) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(min, tooShort).max(max, tooLong).optional(),
  );
}

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .url('Indiquez une adresse complète, commençant par https://')
    .startsWith('https://', 'L’adresse doit commencer par https://')
    .optional(),
);

/**
 * Identifiant lisible utilisé dans les URL.
 *
 * La contrainte `organizations_slug_format` n'accepte que des minuscules, des
 * chiffres et des tirets simples. Un slug saisi avec une majuscule serait
 * refusé par la base après un aller-retour réseau.
 */
const slug = z
  .string()
  .trim()
  .min(2, 'L’identifiant doit comporter au moins 2 caractères.')
  .max(63, 'L’identifiant ne peut pas dépasser 63 caractères.')
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'Minuscules, chiffres et tirets uniquement, sans tiret en début ni en fin.',
  );

// -----------------------------------------------------------------------------

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit comporter au moins 2 caractères.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  slug,
  legal_name: optionalText(
    2,
    200,
    'La dénomination doit comporter au moins 2 caractères.',
    'Dénomination trop longue.',
  ),
  siret: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .trim()
      .regex(/^[0-9]{14}$/, 'Le SIRET comporte exactement 14 chiffres.')
      .optional(),
  ),
  billing_email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .trim()
      .email('Cette adresse électronique n’est pas valide.')
      .transform((value) => value.toLowerCase())
      .optional(),
  ),
  phone: optionalText(4, 32, 'Numéro trop court.', 'Numéro trop long.'),
  address_line1: optionalText(2, 200, 'Adresse trop courte.', 'Adresse trop longue.'),
  postal_code: optionalText(2, 12, 'Code postal trop court.', 'Code postal trop long.'),
  city: optionalText(2, 100, 'Ville trop courte.', 'Ville trop longue.'),
});

export type OrganizationFormInput = z.input<typeof organizationSchema>;
export type OrganizationFormValues = z.output<typeof organizationSchema>;

// -----------------------------------------------------------------------------

export const WEBSITE_STATUSES = [
  'DRAFT',
  'IN_DEVELOPMENT',
  'STAGING',
  'ONLINE',
  'SUSPENDED',
  'ARCHIVED',
] as const;

export const websiteSchema = z.object({
  organization_id: z.string().uuid('Sélectionnez un client.'),
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit comporter au moins 2 caractères.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  slug,
  status: z.enum(WEBSITE_STATUSES),
  production_url: optionalUrl,
  repository_url: optionalUrl,
  hosting_provider: optionalText(
    2,
    60,
    'Nom d’hébergeur trop court.',
    'Nom d’hébergeur trop long.',
  ),
});

export type WebsiteFormInput = z.input<typeof websiteSchema>;
export type WebsiteFormValues = z.output<typeof websiteSchema>;

// -----------------------------------------------------------------------------

export const domainSchema = z.object({
  organization_id: z.string().uuid('Sélectionnez un client.'),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(4, 'Le domaine doit comporter au moins 4 caractères.')
    .max(253, 'Ce domaine est trop long.')
    .regex(
      /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
      'Indiquez un domaine valide, par exemple exemple.fr, sans https ni barre oblique.',
    ),
  website_id: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional(),
  ),
  registrar: optionalText(2, 60, 'Nom trop court.', 'Nom trop long.'),
  is_primary: z.boolean().default(false),
});

export type DomainFormInput = z.input<typeof domainSchema>;
export type DomainFormValues = z.output<typeof domainSchema>;

// -----------------------------------------------------------------------------

export const memberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Renseignez l’adresse électronique de la personne.')
    .email('Cette adresse électronique n’est pas valide.')
    .transform((value) => value.toLowerCase()),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER']),
});

export type MemberFormInput = z.input<typeof memberSchema>;
export type MemberFormValues = z.output<typeof memberSchema>;

/**
 * Dérive un identifiant lisible depuis un nom.
 *
 * Retire les accents, remplace tout le reste par des tirets. Le résultat est
 * une proposition modifiable, jamais imposée : deux clients peuvent porter des
 * noms proches et l'identifiant doit rester unique.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // `\p{Diacritic}` plutot qu'une plage de points de code : la source
    // reste en ASCII, la ou des caracteres combinants bruts survivent mal
    // aux copies entre editeurs.
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}
