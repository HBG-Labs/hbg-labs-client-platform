import { z } from 'zod';

/**
 * Validation des formulaires publics (§4, §5).
 *
 * Ces schémas reproduisent les contraintes CHECK de la migration 15. La
 * duplication est voulue : la base refuse déjà une saisie invalide, mais son
 * message serait un texte PostgreSQL en anglais affiché après un aller-retour
 * réseau. La validation côté client donne un message utile immédiatement.
 *
 * La base reste l'autorité. Un schéma Zod se contourne en désactivant
 * JavaScript, une contrainte CHECK ne se contourne pas (§36).
 *
 *
 * UN CHAMP VIDE N'EST PAS UNE CHAÎNE VIDE
 *
 * Un `<input>` non rempli est enregistré par React Hook Form comme `''`, jamais
 * comme `undefined`. Sans conversion explicite, cette chaîne vide part vers
 * PostgreSQL et viole les contraintes de longueur minimale : la colonne
 * `project_type` accepte NULL ou deux caractères au moins, pas `''`.
 *
 * `optionalText` normalise donc le vide en `undefined` AVANT validation. Les
 * messages d'erreur sont également écrits pour le cas du champ vide, puisque
 * c'est `min()` qui se déclenche alors, jamais `required_error`.
 */

/** Texte facultatif : le vide devient `undefined`, jamais `''`. */
function optionalText(min: number, max: number, tooShort: string, tooLong: string) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(min, tooShort).max(max, tooLong).optional(),
  );
}

const email = z
  .string()
  .trim()
  .min(1, 'Renseignez votre adresse électronique.')
  .max(200, 'Cette adresse est trop longue.')
  .email('Cette adresse électronique n’est pas valide.')
  // La base impose des minuscules (contrainte `*_email_lowercase`).
  .transform((value) => value.toLowerCase());

const fullName = z
  .string()
  .trim()
  .min(2, 'Renseignez votre nom et prénom.')
  .max(120, 'Votre nom ne peut pas dépasser 120 caractères.');

const phone = optionalText(
  4,
  32,
  'Ce numéro paraît trop court.',
  'Ce numéro paraît trop long.',
);

// -----------------------------------------------------------------------------
// Demande de devis (/devis)
// -----------------------------------------------------------------------------

export const PROJECT_TYPES = [
  'Site vitrine',
  'Refonte de site existant',
  'Site avec réservation ou prise de rendez-vous',
  'Boutique en ligne',
  'Reprise en maintenance',
  'Autre projet',
] as const;

export const BUDGET_RANGES = [
  'Moins de 1 000 €',
  'De 1 000 à 2 500 €',
  'De 2 500 à 5 000 €',
  'Plus de 5 000 €',
  'À définir ensemble',
] as const;

export const quoteRequestSchema = z.object({
  full_name: fullName,
  email,
  phone,
  company_name: optionalText(
    2,
    160,
    'Le nom de l’entreprise doit comporter au moins 2 caractères.',
    'Ce nom est trop long.',
  ),
  project_type: optionalText(2, 80, 'Valeur trop courte.', 'Valeur trop longue.'),
  budget_range: optionalText(2, 60, 'Valeur trop courte.', 'Valeur trop longue.'),
  message: z
    .string()
    .trim()
    .min(10, 'Décrivez votre projet en quelques mots (10 caractères minimum).')
    .max(5000, 'Votre message ne peut pas dépasser 5 000 caractères.'),
  /** Code de l'offre à l'origine de la demande, transmis par l'URL. */
  plan_code: optionalText(2, 32, 'Code d’offre invalide.', 'Code d’offre invalide.'),
});

export type QuoteRequestInput = z.input<typeof quoteRequestSchema>;
export type QuoteRequestValues = z.output<typeof quoteRequestSchema>;

// -----------------------------------------------------------------------------
// Message de contact (/contact)
// -----------------------------------------------------------------------------

export const contactMessageSchema = z.object({
  full_name: fullName,
  email,
  phone,
  subject: z
    .string()
    .trim()
    .min(3, 'Indiquez l’objet de votre message (3 caractères minimum).')
    .max(200, 'L’objet ne peut pas dépasser 200 caractères.'),
  message: z
    .string()
    .trim()
    .min(10, 'Rédigez votre message (10 caractères minimum).')
    .max(5000, 'Votre message ne peut pas dépasser 5 000 caractères.'),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessageValues = z.output<typeof contactMessageSchema>;
