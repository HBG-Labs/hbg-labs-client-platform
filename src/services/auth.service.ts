import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

/**
 * Authentification Supabase (§9).
 *
 * Couche mince au-dessus de GoTrue. Elle ne décide rien : elle traduit les
 * erreurs en français et applique deux règles de confidentialité que
 * l'interface ne doit pas avoir à connaître.
 *
 *
 * NE JAMAIS RÉVÉLER QU'UNE ADRESSE EST INSCRITE
 *
 * Un formulaire qui répond « cette adresse n'existe pas » à la connexion, ou
 * « cette adresse est déjà prise » à l'inscription, donne à qui veut un moyen
 * de tester si telle personne est cliente de HBG Labs. Le message de
 * connexion reste donc identique quelle que soit la cause, et l'inscription
 * répond « vérifiez votre boîte » dans tous les cas.
 *
 * Supabase applique la même logique côté serveur : une inscription sur une
 * adresse déjà connue renvoie un utilisateur sans identité plutôt qu'une
 * erreur. On s'aligne sur ce comportement au lieu de le contourner.
 *
 *
 * AUCUNE SESSION SIMULÉE (§9)
 *
 * Toutes les fonctions ci-dessous passent par Supabase Auth. Aucun objet de
 * session n'est fabriqué, aucun contournement de développement n'existe.
 */

/** Erreur d'authentification portant un message destiné à l'utilisateur. */
export class AuthFailure extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthFailure';
    this.code = code;
  }
}

/**
 * Traduit une erreur GoTrue.
 *
 * Le message par défaut reste volontairement neutre : un texte technique
 * anglais affiché à un client n'aide personne et expose le fonctionnement
 * interne.
 */
function translate(error: AuthError): AuthFailure {
  const code = error.code ?? undefined;

  switch (code) {
    case 'invalid_credentials':
      return new AuthFailure(
        'Adresse électronique ou mot de passe incorrect.',
        code,
      );
    case 'email_not_confirmed':
      return new AuthFailure(
        'Votre adresse n’est pas encore confirmée. Ouvrez le lien reçu par courriel.',
        code,
      );
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return new AuthFailure(
        'Trop de tentatives en peu de temps. Patientez quelques minutes avant de réessayer.',
        code,
      );
    case 'weak_password':
      return new AuthFailure(
        'Ce mot de passe est trop faible. Utilisez au moins 10 caractères, avec majuscule, minuscule et chiffre.',
        code,
      );
    case 'same_password':
      return new AuthFailure(
        'Le nouveau mot de passe doit différer de l’actuel.',
        code,
      );
    case 'user_already_exists':
    case 'email_exists':
      // Ne devrait pas remonter jusqu'ici : `signUp` neutralise ce cas.
      return new AuthFailure(
        'Impossible de créer le compte avec ces informations.',
        code,
      );
    case 'validation_failed':
      return new AuthFailure('Les informations saisies sont invalides.', code);
    default:
      return new AuthFailure(
        'La connexion au service d’authentification a échoué. Réessayez dans un instant.',
        code,
      );
  }
}

/** Adresse de retour des liens envoyés par courriel. */
function callbackUrl(next?: string): string {
  const url = new URL('/auth/callback', env.VITE_APP_URL);
  if (next) url.searchParams.set('next', next);
  return url.toString();
}

// -----------------------------------------------------------------------------

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignUpResult {
  /**
   * Vrai si une confirmation par courriel est attendue.
   *
   * Toujours vrai en pratique : la confirmation est exigée sur le projet.
   * Le champ existe pour que l'interface n'ait pas à le supposer.
   */
  requiresEmailConfirmation: boolean;
}

/**
 * Crée un compte.
 *
 * `full_name` transite par les métadonnées d'inscription, que le trigger
 * `handle_new_user` recopie dans `profiles`. Ce trigger ignore délibérément
 * tout le reste : un `platform_role` glissé ici n'aurait aucun effet
 * (migration 02).
 */
export async function signUp({
  email,
  password,
  fullName,
}: SignUpParams): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: callbackUrl('/dashboard'),
    },
  });

  if (error) throw translate(error);

  // Adresse déjà inscrite : Supabase renvoie un utilisateur sans identité
  // plutôt qu'une erreur, précisément pour ne rien révéler. On retourne le
  // même résultat que pour une création réussie.
  const alreadyRegistered = (data.user?.identities?.length ?? 0) === 0;

  return { requiresEmailConfirmation: alreadyRegistered || !data.session };
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw translate(error);
  if (!data.session) {
    throw new AuthFailure('La session n’a pas pu être ouverte. Réessayez.');
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw translate(error);
}

/**
 * Envoie un lien de réinitialisation.
 *
 * Ne signale jamais si l'adresse est inconnue. L'interface affiche le même
 * message dans tous les cas.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl('/reinitialiser-mot-de-passe'),
  });

  if (error) {
    // La limitation de débit doit remonter : sans elle, l'utilisateur
    // cliquerait indéfiniment sans comprendre pourquoi rien n'arrive.
    if (
      error.code === 'over_email_send_rate_limit' ||
      error.code === 'over_request_rate_limit'
    ) {
      throw translate(error);
    }
    // Toute autre erreur est absorbée : la distinguer révélerait l'existence
    // du compte.
    return;
  }
}

/**
 * Définit un nouveau mot de passe.
 *
 * Suppose une session ouverte : soit celle du lien de réinitialisation, soit
 * celle d'un utilisateur connecté changeant son mot de passe.
 */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw translate(error);
}

/**
 * Vérifie le mot de passe actuel avant de le changer.
 *
 * `updateUser` n'exige pas le mot de passe existant. Sans cette vérification,
 * un poste laissé déverrouillé suffirait à prendre le contrôle du compte.
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new AuthFailure('Le mot de passe actuel est incorrect.', verifyError.code);
  }

  await updatePassword(newPassword);
}

/** Renvoie le courriel de confirmation d'adresse. */
export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: callbackUrl('/dashboard') },
  });

  if (error) throw translate(error);
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
