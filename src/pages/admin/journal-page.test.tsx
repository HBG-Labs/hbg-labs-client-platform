import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { AuditLogEntry } from '@/services/audit.service';

/**
 * Journal d'audit (§44).
 *
 * L'écran ne propose aucune action, et ces tests vérifient notamment qu'il
 * n'en propose pas : `audit_logs` n'a aucune policy d'écriture, un bouton de
 * suppression échouerait — et ne devrait pas exister.
 *
 * Ce que couvre l'AFFICHAGE, et ce que couvre la base, sont deux choses
 * distinctes. Que le journal se remplisse, que le personnel seul le lise et
 * qu'aucune ligne ne s'efface est vérifié contre une vraie base par
 * `tests/rls/08-audit-journal.test.ts` et `05-public-surface.test.ts`.
 */

const state: { entries: AuditLogEntry[]; actions: string[] } = {
  entries: [],
  actions: [],
};
const lastFilters = vi.fn();

vi.mock('@/features/audit/useAudit', () => ({
  useAuditLog: (filters: unknown) => {
    lastFilters(filters);
    return {
      data: state.entries,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useAuditActions: () => ({ data: state.actions }),
}));

function entry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'log-1',
    action: 'WEBSITE_STATUS_CHANGED',
    actor_user_id: 'staff-1',
    actor_email: 'hbglabs@gmail.com',
    actor_platform_role: 'OWNER',
    organization_id: 'org-1',
    resource_type: 'website',
    resource_id: 'site-1',
    metadata: { status: { avant: 'DRAFT', apres: 'LIVE' } },
    ip_address: null,
    created_at: '2026-08-30T09:00:00.000Z',
    organization: { id: 'org-1', name: 'Boulangerie Martin' },
    ...overrides,
  };
}

beforeEach(() => {
  state.entries = [];
  state.actions = [];
  lastFilters.mockClear();
});

describe('Journal d’audit', () => {
  it('traduit le verbe journalisé', async () => {
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(screen.getByText('Statut du site modifié')).toBeInTheDocument();
  });

  it('affiche un verbe inconnu tel quel plutôt que de l’escamoter', async () => {
    // Le schéma laisse `action` en texte libre : un verbe ajouté demain doit
    // rester lisible, même sans libellé.
    state.entries = [entry({ action: 'VERBE_INCONNU' })];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(screen.getByText('VERBE_INCONNU')).toBeInTheDocument();
  });

  it('montre la valeur d’avant autant que celle d’après', async () => {
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    // La flèche est décorative : sans ce texte, la transition serait purement
    // visuelle pour un lecteur d'écran.
    expect(screen.getByText('devient')).toBeInTheDocument();
  });

  it('attribue l’action à son auteur et à son client', async () => {
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(
      screen.getByText(/hbglabs@gmail\.com · OWNER · Boulangerie Martin/),
    ).toBeInTheDocument();
  });

  it('dit qu’une action sans auteur vient du système', async () => {
    // Le webhook Stripe agit sans session : un blanc laisserait croire à une
    // donnée manquante là où l'absence d'auteur est la réalité.
    state.entries = [
      entry({
        action: 'SUBSCRIPTION_CHANGED',
        actor_email: null,
        actor_user_id: null,
        actor_platform_role: null,
      }),
    ];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(screen.getByText(/Système, sans session/)).toBeInTheDocument();
  });

  it('signale les actions qui ouvrent l’accès à la plateforme', async () => {
    state.entries = [
      entry({ id: 'log-2', action: 'PLATFORM_ACCESS_GRANTED', metadata: {} }),
    ];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(screen.getByText('Accès plateforme')).toBeInTheDocument();
  });

  it('ne signale pas une action ordinaire', async () => {
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(screen.queryByText('Accès plateforme')).not.toBeInTheDocument();
  });

  it('ne propose aucune modification ni suppression', async () => {
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(
      screen.queryByRole('button', { name: /supprimer|modifier|effacer/i }),
    ).not.toBeInTheDocument();
  });

  it('transmet le filtre par verbe', async () => {
    state.actions = ['TICKET_CREATED', 'WEBSITE_STATUS_CHANGED'];
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    await userEvent.selectOptions(
      screen.getByLabelText(/Type d’action/),
      'TICKET_CREATED',
    );

    expect(lastFilters).toHaveBeenLastCalledWith({ action: 'TICKET_CREATED' });
  });

  it('transmet le filtre par auteur', async () => {
    state.entries = [entry()];

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    await userEvent.type(screen.getByLabelText('Auteur'), 'hbg');

    expect(lastFilters).toHaveBeenLastCalledWith({ actorEmail: 'hbg' });
  });

  it('distingue un journal vide d’une recherche sans résultat', async () => {
    const { JournalPage } = await import('./JournalPage');
    const view = renderWithProviders(<JournalPage />);

    expect(screen.getByText('Le journal est vide')).toBeInTheDocument();

    view.unmount();
    state.actions = ['TICKET_CREATED'];
    renderWithProviders(<JournalPage />);

    await userEvent.selectOptions(
      screen.getByLabelText(/Type d’action/),
      'TICKET_CREATED',
    );

    expect(screen.getByText('Aucune entrée ne correspond')).toBeInTheDocument();
  });

  it('annonce la troncature au lieu de la taire', async () => {
    // Une liste coupée en silence ferait conclure à l'absence d'une action.
    state.entries = Array.from({ length: 100 }, (_, index) =>
      entry({ id: `log-${index}` }),
    );

    const { JournalPage } = await import('./JournalPage');
    renderWithProviders(<JournalPage />);

    expect(
      screen.getByText(/Seules les 100 entrées les plus récentes sont affichées/),
    ).toBeInTheDocument();
  });
});
