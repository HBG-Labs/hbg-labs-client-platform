import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Support : confidentialité des notes internes et périmètre d'écriture client.
 *
 * Le scénario de fuite le plus plausible du schéma se trouve ici. Une note
 * interne vit sur la même table que les messages visibles, dans un fil que le
 * client a par ailleurs le droit de lire. Rien ne la distingue qu'une
 * condition dans une policy.
 */

let f: Fixtures;

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

describe('Notes internes', () => {
  it('Le client lit le message public de son ticket', async () => {
    const { data, error } = await f.userA.db
      .from('support_messages')
      .select('id')
      .eq('id', f.publicMessageA);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('Le client ne lit JAMAIS la note interne', async () => {
    const { data, error } = await f.userA.db
      .from('support_messages')
      .select('id, body')
      .eq('id', f.internalNoteA);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('Une lecture complète du fil ne fait pas apparaître la note', async () => {
    // Le chemin réellement emprunté par l'interface : charger tout le fil.
    const { data } = await f.userA.db
      .from('support_messages')
      .select('id, body, is_internal_note')
      .eq('ticket_id', f.ticketA);

    const ids = (data ?? []).map((m) => m.id);
    expect(ids).toContain(f.publicMessageA);
    expect(ids).not.toContain(f.internalNoteA);
    expect((data ?? []).every((m) => m.is_internal_note === false)).toBe(true);
  });

  it('Un filtre explicite sur is_internal_note ne la révèle pas davantage', async () => {
    const { data } = await f.userA.db
      .from('support_messages')
      .select('id')
      .eq('ticket_id', f.ticketA)
      .eq('is_internal_note', true);

    expect(data ?? []).toHaveLength(0);
  });

  it('Le personnel plateforme, lui, la voit', async () => {
    const { data, error } = await f.platformAdmin.db
      .from('support_messages')
      .select('id')
      .eq('id', f.internalNoteA);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('Un client ne peut pas écrire de note interne', async () => {
    const { error } = await f.userA.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.userA.userId,
      body: 'Tentative de note interne.',
      is_internal_note: true,
    });

    // Le trigger `stamp_message_author_role` ramène le champ à false pour un
    // auteur non-staff : l'insertion réussit, mais le message est public.
    // Ce qui compte est qu'aucun client ne dispose du canal confidentiel.
    if (!error) {
      const check = await f.admin
        .from('support_messages')
        .select('is_internal_note, author_is_staff')
        .eq('ticket_id', f.ticketA)
        .eq('author_id', f.userA.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(check.data?.is_internal_note).toBe(false);
      expect(check.data?.author_is_staff).toBe(false);
    }
  });

  it('Un client ne peut pas se faire passer pour HBG Labs', async () => {
    // `author_is_staff` est déterminé côté serveur. Sans cela, n'importe quel
    // message client s'afficherait comme une réponse officielle.
    await f.userA.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.userA.userId,
      body: 'Message qui tente de se déclarer officiel.',
      author_is_staff: true,
    });

    const { data } = await f.admin
      .from('support_messages')
      .select('author_is_staff')
      .eq('ticket_id', f.ticketA)
      .eq('author_id', f.userA.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(data?.author_is_staff).toBe(false);
  });

  it('Un client ne peut pas signer un message au nom d un autre', async () => {
    const { error } = await f.userA.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.userA2.userId,
      body: 'Message attribué à un collègue.',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Un message envoyé n est ni modifiable ni supprimable', async () => {
    // Un fil de support réécrit a posteriori perd toute valeur en cas de litige.
    const update = await f.userA.db
      .from('support_messages')
      .update({ body: 'Contenu réécrit.' })
      .eq('id', f.publicMessageA)
      .select('id');

    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);

    await f.userA.db.from('support_messages').delete().eq('id', f.publicMessageA);
    const check = await f.admin
      .from('support_messages')
      .select('id')
      .eq('id', f.publicMessageA);
    expect(check.data).toHaveLength(1);
  });
});

describe('Messages d un autre tenant', () => {
  it('Le fil du ticket B est invisible depuis l organisation A', async () => {
    const { data } = await f.userA.db
      .from('support_messages')
      .select('id')
      .eq('ticket_id', f.ticketB);

    expect(data ?? []).toHaveLength(0);
  });

  it('Impossible d écrire dans le fil d un autre tenant', async () => {
    const { error } = await f.userA.db.from('support_messages').insert({
      ticket_id: f.ticketB,
      author_id: f.userA.userId,
      body: 'Intrusion dans le fil d un autre client.',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('Périmètre de modification d un ticket par le client', () => {
  it('Le client ne peut pas relever la priorité de sa demande', async () => {
    // Sans cette garde, tous les tickets seraient URGENT et la file de
    // traitement de HBG Labs perdrait son sens.
    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ priority: 'URGENT' })
      .eq('id', f.ticketA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Le client ne peut pas s affecter le ticket', async () => {
    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ assigned_to: f.userA.userId })
      .eq('id', f.ticketA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Le client ne peut pas réécrire sa demande après envoi', async () => {
    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ description: 'Description entièrement réécrite après coup.' })
      .eq('id', f.ticketA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Le client ne peut pas passer sa demande en IN_PROGRESS', async () => {
    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', f.ticketA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Le client PEUT clore sa propre demande', async () => {
    // Contre-épreuve : la garde ne doit pas verrouiller l'usage légitime.
    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ status: 'CLOSED' })
      .eq('id', f.ticketA);

    expect(error).toBeNull();

    const check = await f.admin
      .from('support_tickets')
      .select('status, closed_at')
      .eq('id', f.ticketA)
      .single();

    expect(check.data?.status).toBe('CLOSED');
    // La date de clôture est posée par trigger, jamais par l'appelant.
    expect(check.data?.closed_at).not.toBeNull();
  });

  it('Le client PEUT rouvrir une demande close', async () => {
    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ status: 'OPEN' })
      .eq('id', f.ticketA);

    expect(error).toBeNull();

    const check = await f.admin
      .from('support_tickets')
      .select('status, closed_at')
      .eq('id', f.ticketA)
      .single();

    expect(check.data?.status).toBe('OPEN');
    expect(check.data?.closed_at).toBeNull();
  });

  it('Répondre à un ticket en attente le remet dans la file', async () => {
    // Vérifie le trigger `bump_ticket_activity` ET le drapeau interne qui lui
    // permet de franchir la garde : sans lui, cette réponse échouerait.
    await f.admin
      .from('support_tickets')
      .update({ status: 'WAITING_CLIENT' })
      .eq('id', f.ticketA);

    const { error } = await f.userA.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.userA.userId,
      body: 'Voici les informations complémentaires demandées.',
    });

    expect(error).toBeNull();

    const check = await f.admin
      .from('support_tickets')
      .select('status')
      .eq('id', f.ticketA)
      .single();

    expect(check.data?.status).toBe('OPEN');
  });

  it('Le client crée une demande dans son organisation', async () => {
    const { data, error } = await f.userA.db
      .from('support_tickets')
      .insert({
        organization_id: f.orgA,
        created_by: f.userA.userId,
        type: 'CHANGE_REQUEST',
        category: 'SITE',
        subject: 'Modifier les horaires affichés',
        description: 'Merci de remplacer les horaires du samedi par 9h-13h.',
      })
      .select('id, reference, status')
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('OPEN');
    // Référence lisible générée par la séquence.
    expect(data?.reference).toMatch(/^HBG-\d{6,}$/);
  });

  it('Le client ne peut pas attribuer sa demande à un collègue', async () => {
    const { error } = await f.userA.db.from('support_tickets').insert({
      organization_id: f.orgA,
      created_by: f.userA2.userId,
      subject: 'Demande signée par un autre',
      description: 'Tentative d attribution de la demande à un collègue.',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});
