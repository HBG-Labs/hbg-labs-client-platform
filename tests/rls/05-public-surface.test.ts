import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Surface publique — ce qu'un visiteur muni de la seule clé anon peut atteindre.
 *
 * La clé anon est PUBLIQUE : elle figure dans le bundle JavaScript, lisible par
 * quiconque ouvre les outils de développement. Ce fichier définit donc, en
 * pratique, ce qu'Internet peut lire et écrire sur la base de HBG Labs.
 *
 * Périmètre attendu :
 *   LECTURE  — le catalogue d'offres publiques, et rien d'autre.
 *   ÉCRITURE — les demandes de devis et messages de contact, sans relecture.
 */

let f: Fixtures;

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

describe('Catalogue public', () => {
  it('Le visiteur lit les offres publiques', async () => {
    // La page /tarifs doit fonctionner sans authentification (§7).
    const { data, error } = await f.anon.from('plans').select('code, name').eq('is_public', true);

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(3);
    expect((data ?? []).map((p) => p.code)).toEqual(
      expect.arrayContaining(['STARTER', 'PRO', 'BUSINESS']),
    );
  });

  it('Le visiteur lit les prix actifs', async () => {
    const { data, error } = await f.anon
      .from('plan_prices')
      .select('unit_amount_cents, kind, currency, is_starting_price');

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(5);
    // Les prix vivent en base, jamais en dur dans le frontend (§7).
    expect((data ?? []).map((p) => p.unit_amount_cents)).toEqual(
      expect.arrayContaining([59000, 1900, 89000, 4900, 7900]),
    );
  });

  it('Le visiteur lit les caractéristiques des offres', async () => {
    const { data, error } = await f.anon.from('plan_features').select('label, is_included');

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('Un plan retiré du catalogue devient invisible', async () => {
    await f.admin.from('plans').update({ is_active: false }).eq('code', 'STARTER');

    const { data } = await f.anon.from('plans').select('code').eq('code', 'STARTER');
    expect(data ?? []).toHaveLength(0);

    // Ses prix disparaissent avec lui : la policy remonte jusqu'au plan.
    const prices = await f.anon
      .from('plan_prices')
      .select('id, plan_id')
      .eq('plan_id', (await f.admin.from('plans').select('id').eq('code', 'STARTER').single()).data!.id);
    expect(prices.data ?? []).toHaveLength(0);

    await f.admin.from('plans').update({ is_active: true }).eq('code', 'STARTER');
  });

  it('Le visiteur ne peut pas modifier le catalogue', async () => {
    // Deux barrières indépendantes, vérifiées ensemble :
    //   - le PRIVILÈGE d'écriture est retiré à anon (migration 16) → erreur 42501 ;
    //   - même sans lui, aucune policy UPDATE ne vise anon → zéro ligne touchée.
    //
    // Cette seconde vérification compte autant que la première : une écriture
    // que seule la RLS bloque ne lève PAS d'erreur, elle n'affecte simplement
    // rien. Une assertion portant uniquement sur l'erreur laisserait donc
    // passer une régression de privilèges sans rien signaler — ce qui est
    // précisément ce qui s'était produit avant la migration 16.
    const { data, error } = await f.anon
      .from('plan_prices')
      .update({ unit_amount_cents: 1 })
      .eq('unit_amount_cents', 4900)
      .select('id');

    expect(error?.code).toBe('42501');
    expect(data ?? []).toHaveLength(0);

    const check = await f.admin
      .from('plan_prices')
      .select('id')
      .eq('unit_amount_cents', 1);
    expect(check.data ?? []).toHaveLength(0);
  });

  it('Le visiteur ne peut ni insérer ni supprimer dans le catalogue', async () => {
    const insert = await f.anon
      .from('plan_prices')
      .insert({ plan_id: f.planId, kind: 'ONE_TIME', unit_amount_cents: 1 });
    expect(insert.error?.code).toBe('42501');

    const remove = await f.anon
      .from('plans')
      .delete()
      .eq('code', 'PRO')
      .select('id');
    expect(remove.error?.code).toBe('42501');

    const check = await f.admin.from('plans').select('id').eq('code', 'PRO');
    expect(check.data).toHaveLength(1);
  });
});

describe('Tables fermées au visiteur', () => {
  const CLOSED_TABLES = [
    'profiles',
    'organizations',
    'organization_members',
    'websites',
    'domains',
    'subscriptions',
    'invoices',
    'payments',
    'support_tickets',
    'support_messages',
    'ticket_attachments',
    'notifications',
    'audit_logs',
    'stripe_webhook_events',
    'quote_requests',
    'contact_messages',
  ] as const;

  it.each(CLOSED_TABLES)('%s est illisible sans authentification', async (table) => {
    const { data, error } = await f.anon.from(table).select('*').limit(5);

    // Privilège retiré ⇒ erreur ; policy absente ⇒ tableau vide.
    // Les deux sont des refus ; ce qui compte est qu'aucune donnée ne sorte.
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});

describe('Formulaires publics', () => {
  it('Le visiteur envoie une demande de devis', async () => {
    const { error } = await f.anon.from('quote_requests').insert({
      full_name: 'Prospect Test',
      email: `rlstest-devis-${Date.now()}@exemple.test`,
      company_name: 'Boulangerie Test',
      message: 'Je souhaite un site vitrine pour ma boulangerie en Martinique.',
    });

    expect(error).toBeNull();
  });

  it('Le visiteur envoie un message de contact', async () => {
    const { error } = await f.anon.from('contact_messages').insert({
      full_name: 'Prospect Test',
      email: `rlstest-contact-${Date.now()}@exemple.test`,
      subject: 'Question sur vos offres',
      message: 'Bonjour, proposez-vous la reprise de sites existants ?',
    });

    expect(error).toBeNull();
  });

  it('Le visiteur ne peut PAS relire les demandes envoyées', async () => {
    // Sans cette restriction, les coordonnées et projets de tous les
    // prospects de HBG Labs seraient lisibles depuis la clé publique du site.
    const quotes = await f.anon.from('quote_requests').select('email, message');
    expect(quotes.error !== null || (quotes.data ?? []).length === 0).toBe(true);

    const contacts = await f.anon.from('contact_messages').select('email, message');
    expect(contacts.error !== null || (contacts.data ?? []).length === 0).toBe(true);
  });

  it('Le visiteur ne peut pas préqualifier sa propre demande', async () => {
    const { error } = await f.anon.from('quote_requests').insert({
      full_name: 'Prospect Test',
      email: `rlstest-qualif-${Date.now()}@exemple.test`,
      message: 'Tentative de création avec un statut déjà qualifié.',
      status: 'CONVERTED',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('La limitation de débit bloque les envois répétés', async () => {
    const email = `rlstest-flood-${Date.now()}@exemple.test`;
    const payload = {
      full_name: 'Robot Test',
      email,
      message: 'Message répété pour vérifier la limitation de débit.',
    };

    // Trois envois sont tolérés, le quatrième doit être refusé.
    for (let i = 0; i < 3; i++) {
      const { error } = await f.anon.from('contact_messages').insert({
        ...payload,
        subject: `Envoi numéro ${i + 1}`,
      });
      expect(error).toBeNull();
    }

    const { error } = await f.anon.from('contact_messages').insert({
      ...payload,
      subject: 'Envoi numéro 4',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('54000');

    await f.admin.from('contact_messages').delete().eq('email', email);
  });

  it('Le personnel plateforme lit les demandes reçues', async () => {
    const { error } = await f.platformAdmin.db.from('quote_requests').select('id').limit(1);
    expect(error).toBeNull();
  });

  it('Un client authentifié ne lit pas les demandes de devis', async () => {
    // Être client de HBG Labs ne donne aucun droit sur son fichier prospects.
    const { data, error } = await f.userA.db.from('quote_requests').select('id').limit(5);
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});

describe('Journal d audit', () => {
  it('Réservé au personnel plateforme en lecture', async () => {
    const asClient = await f.userA.db.from('audit_logs').select('id').limit(1);
    expect(asClient.error !== null || (asClient.data ?? []).length === 0).toBe(true);

    const asStaff = await f.platformAdmin.db.from('audit_logs').select('id').limit(1);
    expect(asStaff.error).toBeNull();
  });

  it('Aucune écriture directe, pour aucun rôle', async () => {
    // L'écriture passe exclusivement par log_audit_event(), qui impose
    // l'auteur réel. Une insertion directe permettrait d'attribuer une action
    // à quelqu'un d'autre.
    const asStaff = await f.platformAdmin.db.from('audit_logs').insert({
      action: 'FORGED_ACTION',
      resource_type: 'website',
    });
    expect(asStaff.error).not.toBeNull();

    const asClient = await f.userA.db.from('audit_logs').insert({ action: 'FORGED_ACTION' });
    expect(asClient.error).not.toBeNull();
  });

  it('log_audit_event impose l auteur réel', async () => {
    const { data, error } = await f.userA.db.rpc('log_audit_event', {
      p_action: 'PROFILE_UPDATED',
      p_resource_type: 'profile',
      p_resource_id: f.userA.userId,
      p_organization_id: f.orgA,
    });

    expect(error).toBeNull();

    const entry = await f.admin
      .from('audit_logs')
      .select('actor_user_id, actor_email, action')
      .eq('id', data as string)
      .single();

    expect(entry.data?.actor_user_id).toBe(f.userA.userId);
    expect(entry.data?.actor_email).toBe(f.userA.email);
  });

  it('Impossible de journaliser dans le tenant d un autre', async () => {
    const { error } = await f.userA.db.rpc('log_audit_event', {
      p_action: 'FORGED_ACTION',
      p_organization_id: f.orgB,
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Une entrée de journal n est ni modifiable ni supprimable', async () => {
    const created = await f.userA.db.rpc('log_audit_event', { p_action: 'USER_SIGNED_IN' });
    const logId = created.data as string;

    const update = await f.platformAdmin.db
      .from('audit_logs')
      .update({ action: 'REWRITTEN' })
      .eq('id', logId)
      .select('id');
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);

    await f.platformAdmin.db.from('audit_logs').delete().eq('id', logId);
    const check = await f.admin.from('audit_logs').select('action').eq('id', logId).single();
    expect(check.data?.action).toBe('USER_SIGNED_IN');

    await f.admin.from('audit_logs').delete().eq('id', logId);
  });
});

describe('Création d organisation en libre-service', () => {
  it('create_organization crée l organisation ET son adhésion OWNER', async () => {
    const slug = `rlstest-self-${Date.now()}`;
    const { data, error } = await f.userB.db.rpc('create_organization', {
      p_name: 'Organisation autonome',
      p_slug: slug,
    });

    expect(error).toBeNull();
    const orgId = data as string;

    const membership = await f.admin
      .from('organization_members')
      .select('role, status')
      .eq('organization_id', orgId)
      .eq('user_id', f.userB.userId)
      .single();

    expect(membership.data?.role).toBe('OWNER');
    expect(membership.data?.status).toBe('ACTIVE');

    await f.admin.from('organizations').delete().eq('id', orgId);
  });

  it('L insertion directe reste réservée aux administrateurs plateforme', async () => {
    const { error } = await f.userA.db.from('organizations').insert({
      name: 'Organisation orpheline',
      slug: `rlstest-orphan-${Date.now()}`,
    });

    // Refusée : sans adhésion créée dans la même transaction, l'organisation
    // serait invisible de son créateur et impossible à administrer.
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Le visiteur anonyme ne peut pas créer d organisation', async () => {
    const { error } = await f.anon.rpc('create_organization', {
      p_name: 'Anonyme',
      p_slug: `rlstest-anon-${Date.now()}`,
    });

    expect(error).not.toBeNull();
  });
});
