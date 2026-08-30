import { describe, expect, it } from 'vitest';
import {
  intervalLabel,
  isEndedSubscription,
  isLiveSubscription,
  renewalNotice,
} from './billing-display';

/**
 * Règles d'affichage de la facturation.
 *
 * Trois erreurs sont possibles ici, et toutes se lisent comme des informations
 * plausibles : annoncer un renouvellement à un client qui a résilié, présenter
 * un montant annuel comme mensuel, et couper l'accès au premier échec de
 * prélèvement. Aucune ne produit d'erreur visible ailleurs.
 */

const base = {
  status: 'active' as const,
  cancel_at_period_end: false,
  current_period_end: '2026-09-01T00:00:00.000Z',
  ended_at: null,
};

describe('renewalNotice', () => {
  it('annonce un renouvellement pour un abonnement reconduit', () => {
    expect(renewalNotice(base)).toEqual({
      kind: 'renewal',
      date: '2026-09-01T00:00:00.000Z',
    });
  });

  it('annonce une fin, pas un renouvellement, quand la résiliation est programmée', () => {
    expect(renewalNotice({ ...base, cancel_at_period_end: true }).kind).toBe('ends');
  });

  it('donne la priorité à la fin effective sur la période en cours', () => {
    // Un abonnement terminé peut conserver une date de fin de période. La
    // présenter comme une échéance ferait attendre un prélèvement qui n'aura
    // jamais lieu.
    const notice = renewalNotice({
      ...base,
      status: 'canceled',
      ended_at: '2026-08-15T00:00:00.000Z',
    });

    expect(notice).toEqual({ kind: 'ended', date: '2026-08-15T00:00:00.000Z' });
  });

  it('ne dit rien plutôt que d’inventer une date', () => {
    expect(renewalNotice({ ...base, current_period_end: null })).toEqual({
      kind: 'none',
      date: null,
    });
  });
});

describe('isLiveSubscription', () => {
  it('maintient l’accès pendant un incident de paiement', () => {
    // Le contrat court, le recouvrement est en cours : couper l'accès dès le
    // premier échec pénaliserait un client dont la carte vient d'expirer.
    expect(isLiveSubscription('past_due')).toBe(true);
  });

  it('couvre l’essai et l’abonnement actif', () => {
    expect(isLiveSubscription('trialing')).toBe(true);
    expect(isLiveSubscription('active')).toBe(true);
  });

  it('exclut les abonnements qui ne donnent plus accès', () => {
    for (const status of ['canceled', 'unpaid', 'incomplete_expired', 'paused'] as const) {
      expect(isLiveSubscription(status)).toBe(false);
    }
  });

  it('ne considère jamais un abonnement à la fois en cours et terminé', () => {
    for (const status of [
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused',
    ] as const) {
      expect(isLiveSubscription(status) && isEndedSubscription(status)).toBe(false);
    }
  });
});

describe('intervalLabel', () => {
  it('distingue le mensuel de l’annuel', () => {
    expect(intervalLabel('month')).toBe('par mois');
    expect(intervalLabel('year')).toBe('par an');
  });

  it('ne suppose pas « par mois » quand la périodicité est inconnue', () => {
    // Un montant annuel présenté comme mensuel afficherait un tarif douze fois
    // trop bas.
    expect(intervalLabel(null)).toBe('');
  });
});
