import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes Tailwind en résolvant les conflits.
 *
 * `clsx` assemble les classes conditionnelles ; `twMerge` élimine ensuite les
 * doublons contradictoires. Sans lui, `cn('px-4', 'px-6')` produirait les deux
 * classes et le résultat dépendrait de leur ordre dans la feuille de style —
 * pas de l'ordre d'appel, ce qui est la source de bugs de style les plus
 * difficiles à comprendre.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant EN CENTIMES vers une chaîne monétaire française.
 *
 * Les montants circulent en centiers entiers de bout en bout — base, Stripe,
 * application. La conversion en unité monétaire n'a lieu qu'ici, au moment de
 * l'affichage, et jamais dans un calcul.
 *
 *   formatAmount(4900)  → « 49,00 € »
 *   formatAmount(59000) → « 590,00 € »
 */
export function formatAmount(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/** Variante sans décimales, pour les prix ronds d'une grille tarifaire. */
export function formatAmountCompact(cents: number, currency = 'EUR'): string {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

/** Date longue en français : « 28 août 2026 ». */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Date et heure : « 28 août 2026 à 14:30 ». */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
