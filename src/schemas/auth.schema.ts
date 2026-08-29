import { z } from 'zod';

/**
 * Validation des formulaires d'authentification (§9).
 *
 * La politique de mot de passe reproduit celle du projet Supabase : dix
 * caractères, au moins une minuscule, une majuscule et un chiffre. La
 * dupliquer ici sert à afficher un message français utile avant l'envoi ;
 * GoTrue reste l'autorité et refuserait de toute façon un mot de passe
 * insuffisant.
 *
 * Les deux doivent rester alignés. Assouplir ce schéma sans toucher au projet
 * produirait un formulaire qui accepte puis échoue au serveur, avec un message
 * en anglais.
 */

const email = z
  .string()
  .trim()
  .min(1, 'Renseignez votre adresse électronique.')
  .max(200, 'Cette adresse est trop longue.')
  .email('Cette adresse électronique n’est pas valide.')
  .transform((value) => value.toLowerCase());

/**
 * Mot de passe à la création ou au changement.
 *
 * Les règles sont énoncées séparément pour que le message désigne ce qui
 * manque. Un unique « mot de passe invalide » laisse chercher.
 */
const newPassword = z
  .string()
  .min(10, 'Votre mot de passe doit comporter au moins 10 caractères.')
  .max(72, 'Votre mot de passe ne peut pas dépasser 72 caractères.')
  .regex(/[a-z]/, 'Ajoutez au moins une lettre minuscule.')
  .regex(/[A-Z]/, 'Ajoutez au moins une lettre majuscule.')
  .regex(/[0-9]/, 'Ajoutez au moins un chiffre.');

/**
 * Mot de passe à la connexion.
 *
 * Aucune règle de complexité : un compte créé sous une ancienne politique doit
 * pouvoir se connecter. Vérifier la complexité ici refuserait localement un
 * mot de passe que le serveur accepte.
 */
const existingPassword = z.string().min(1, 'Renseignez votre mot de passe.');

// -----------------------------------------------------------------------------

export const signInSchema = z.object({
  email,
  password: existingPassword,
});

export type SignInInput = z.input<typeof signInSchema>;
export type SignInValues = z.output<typeof signInSchema>;

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Renseignez votre nom et prénom.')
      .max(120, 'Votre nom ne peut pas dépasser 120 caractères.'),
    email,
    password: newPassword,
    password_confirmation: z.string(),
    accept_terms: z.literal(true, {
      errorMap: () => ({
        message: 'Vous devez accepter les conditions générales pour créer un compte.',
      }),
    }),
  })
  // `path` place l'erreur sous le champ de confirmation, là où l'utilisateur
  // regarde. Sans lui, elle remonterait au niveau du formulaire entier.
  //
  // ORDRE D'ÉVALUATION : un `refine` posé sur l'objet ne s'exécute que si
  // TOUS les champs ont passé leur propre validation. Un mot de passe trop
  // court ou une case non cochée masque donc temporairement l'erreur de
  // correspondance, qui apparaît au passage suivant. C'est le comportement de
  // Zod, et il reste acceptable : les erreurs de champ se corrigent d'abord.
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['password_confirmation'],
  });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpValues = z.output<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });

export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['password_confirmation'],
  });

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ResetPasswordValues = z.output<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    current_password: existingPassword,
    password: newPassword,
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['password_confirmation'],
  })
  .refine((values) => values.current_password !== values.password, {
    message: 'Le nouveau mot de passe doit différer de l’actuel.',
    path: ['password'],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordValues = z.output<typeof changePasswordSchema>;
