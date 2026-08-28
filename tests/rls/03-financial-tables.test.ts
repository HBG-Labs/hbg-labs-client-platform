import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Tables financières — lecture seule pour tout le monde (§20, §22).
 *
 * « Le frontend ne doit jamais décider lui-même qu'un paiement est réussi,
 *   qu'un abonnement est actif, qu'une facture est payée. »
 *
 * Cette garantie ne tient que si AUCUN rôle applicatif ne peut écrire dans
 * `subscriptions`, `invoices` et `payments` — administrateur plateforme
 * compris. C'est ce que vérifie ce fichier, pour chaque rôle et chaque
 * opération.
 */

let f: Fixtures;

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

const MONEY_TABLES = ['subscriptions', 'invoices', 'payments'] as const;

/** Un refus se manifeste par une erreur, ou par zéro ligne affectée. */
function isDenied(error: { code?: string } | null, data: unknown[] | null): boolean {
  if (error) return true;
  return (data ?? []).length === 0;
}

describe('Aucune écriture applicative sur les tables financières', () => {
  describe.each(MONEY_TABLES)('%s', (table) => {
    it('Le OWNER client ne peut pas modifier ses propres lignes', async () => {
      const { data, error } = await f.userA.db
        .from(table)
        .update({ updated_at: new Date().toISOString() })
        .eq('organization_id', f.orgA)
        .select('id');

      expect(isDenied(error, data)).toBe(true);
    });

    it('L administrateur plateforme ne le peut pas non plus', async () => {
      // Le point essentiel : même HBG Labs passe par Stripe. Une ligne
      // corrigée à la main ici diverge du prélèvement réel sans que rien ne
      // le signale.
      const { data, error } = await f.platformAdmin.db
        .from(table)
        .update({ updated_at: new Date().toISOString() })
        .eq('organization_id', f.orgA)
        .select('id');

      expect(isDenied(error, data)).toBe(true);
    });

    it('Aucune suppression n est possible', async () => {
      const before = await f.admin.from(table).select('id').eq('organization_id', f.orgA);

      await f.platformAdmin.db.from(table).delete().eq('organization_id', f.orgA);

      const after = await f.admin.from(table).select('id').eq('organization_id', f.orgA);
      expect(after.data?.length).toBe(before.data?.length);
    });
  });

  it('Un client ne peut pas s inventer un abonnement actif', async () => {
    // Le scénario qui donne accès au service sans payer.
    const { error } = await f.userA.db.from('subscriptions').insert({
      organization_id: f.orgA,
      stripe_subscription_id: 'sub_faux123',
      stripe_customer_id: 'cus_faux123',
      status: 'active',
      unit_amount_cents: 0,
      recurring_interval: 'month',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Un client ne peut pas déclarer une facture payée', async () => {
    const { data, error } = await f.userA.db
      .from('invoices')
      .update({ status: 'paid', amount_paid_cents: 999_999 })
      .eq('id', f.invoiceA)
      .select('id');

    expect(isDenied(error, data)).toBe(true);
  });

  it('Un client ne peut pas s inscrire un paiement réussi', async () => {
    const { error } = await f.userA.db.from('payments').insert({
      organization_id: f.orgA,
      stripe_payment_intent_id: 'pi_faux123',
      amount_cents: 4900,
      status: 'succeeded',
      paid_at: new Date().toISOString(),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('Registre des webhooks Stripe — table fermée', () => {
  it('Inaccessible en lecture, y compris à l administrateur plateforme', async () => {
    // La charge utile brute contient identifiants clients, montants et
    // métadonnées de moyens de paiement. Aucun rôle applicatif n'y accède.
    const asAdmin = await f.platformAdmin.db.from('stripe_webhook_events').select('event_id');
    expect(isDenied(asAdmin.error, asAdmin.data)).toBe(true);

    const asClient = await f.userA.db.from('stripe_webhook_events').select('event_id');
    expect(isDenied(asClient.error, asClient.data)).toBe(true);

    const asAnon = await f.anon.from('stripe_webhook_events').select('event_id');
    expect(isDenied(asAnon.error, asAnon.data)).toBe(true);
  });

  it('Inaccessible en écriture', async () => {
    const { error } = await f.platformAdmin.db.from('stripe_webhook_events').insert({
      event_id: 'evt_faux123',
      event_type: 'invoice.paid',
      payload: {},
    });

    expect(error).not.toBeNull();
  });

  it('event_id en clé primaire garantit l idempotence', async () => {
    // La garantie sur laquelle repose tout le traitement des webhooks : une
    // relivraison Stripe ne peut pas produire un second traitement.
    const event = {
      event_id: `evt_rlstest${Date.now()}`,
      event_type: 'invoice.paid',
      payload: { object: 'event' },
    };

    const first = await f.admin.from('stripe_webhook_events').insert(event);
    expect(first.error).toBeNull();

    const replay = await f.admin.from('stripe_webhook_events').insert(event);
    expect(replay.error).not.toBeNull();
    expect(replay.error?.code).toBe('23505'); // unique_violation

    await f.admin.from('stripe_webhook_events').delete().eq('event_id', event.event_id);
  });
});

describe('Cohérence financière imposée par le schéma', () => {
  it('Un remboursement ne peut pas excéder le montant encaissé', async () => {
    const { error } = await f.admin
      .from('payments')
      .update({ refunded_amount_cents: 999_999 })
      .eq('id', f.paymentA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });

  it('Le champ card_last4 refuse un numéro de carte complet', async () => {
    // La contrainte de format est la barrière technique contre le stockage
    // d'un PAN (§23).
    const { error } = await f.admin
      .from('payments')
      .update({ card_last4: '4242424242424242' })
      .eq('id', f.paymentA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });

  it('Une facture marquée payée doit porter sa date de paiement', async () => {
    const { error } = await f.admin
      .from('invoices')
      .update({ status: 'paid', paid_at: null })
      .eq('id', f.invoiceA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });

  it('Le MRR est calculé par la base, jamais écrit', async () => {
    const { data } = await f.admin
      .from('subscriptions')
      .select('mrr_cents, unit_amount_cents, status')
      .eq('id', f.subscriptionA)
      .single();

    // 49 €/mois, statut active ⇒ 4900 centimes de MRR.
    expect(data?.mrr_cents).toBe(4900);

    // Colonne générée : toute tentative d'écriture est rejetée par PostgreSQL.
    const { error } = await f.admin
      .from('subscriptions')
      .update({ mrr_cents: 100_000 })
      .eq('id', f.subscriptionA);

    expect(error).not.toBeNull();
  });

  it('Un abonnement annulé ne contribue plus au MRR', async () => {
    await f.admin
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', f.subscriptionB);

    const { data } = await f.admin
      .from('subscriptions')
      .select('mrr_cents')
      .eq('id', f.subscriptionB)
      .single();

    expect(data?.mrr_cents).toBe(0);

    await f.admin
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', f.subscriptionB);
  });
});
