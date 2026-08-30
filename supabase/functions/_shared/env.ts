/**
 * Lecture des secrets de fonction.
 *
 * Un secret absent doit se manifester par son nom, tout de suite. Sans cette
 * garde, une clé manquante devient un appel HTTP sans en-tête d'autorisation,
 * puis un 401 du service distant : le message d'erreur désigne alors Resend ou
 * Stripe, jamais la variable qui manque.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Secret manquant : ${name}. Voir docs/SETUP.md.`);
  }

  return value;
}
