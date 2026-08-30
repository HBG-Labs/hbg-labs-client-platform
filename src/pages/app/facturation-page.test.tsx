import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import type {
  ClientInvoice,
  ClientPayment,
  ClientSubscription,
} from '@/services/billing.service';
import type { PublicPlan } from '@/services/plans.service';
import type { MembershipWithOrganization } from '@/services/profiles.service';

/**
 * Écran de facturation (§18, §23).
 *
 * Ces tests portent sur la seule chose que l'écran décide : CE QU'IL AFFIRME.
 * Le reste — qui a le droit de lire une facture, qui peut écrire dans les
 * tables financières — est vérifié contre une vraie base par
 * `tests/rls/03-financial-tables.test.ts`.
 *
 * Le cas le plus important est le premier : au retour de Stripe, l'écran ne
 * doit PAS annoncer que l'abonnement est actif. Le webhook n'est pas encore
 * arrivé, et un paiement peut être refusé après la redirection.
 */

const state: {
  subscriptions: ClientSubscription[];
  invoices: ClientInvoice[];
  payments: ClientPayment[];
  memberships: MembershipWithOrganization[];
  plans: PublicPlan[];
} = {
  subscriptions: [],
  invoices: [],
  payments: [],
  memberships: [],
  plans: [],
};

const query = <T,>(data: T) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
});

const mutation = () => ({
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
});

vi.mock('@/features/billing/useBilling', () => ({
  useMySubscriptions: () => query(state.subscriptions),
  useMyInvoices: () => query(state.invoices),
  useMyPayments: () => query(state.payments),
  useBillingPortal: () => mutation(),
  useStartCheckout: () => mutation(),
}));

vi.mock('@/features/auth/useProfile', () => ({
  useMyOrganizations: () => query(state.memberships),
}));

vi.mock('@/features/pricing/usePublicPlans', () => ({
  usePublicPlans: () => query(state.plans),
}));

function subscription(overrides: Partial<ClientSubscription> = {}): ClientSubscription {
  return {
    id: 'sub-1',
    organization_id: 'org-1',
    status: 'active',
    quantity: 1,
    unit_amount_cents: 1900,
    currency: 'EUR',
    recurring_interval: 'month',
    current_period_start: '2026-08-01T00:00:00.000Z',
    current_period_end: '2026-09-01T00:00:00.000Z',
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    trial_end: null,
    started_at: '2026-08-01T00:00:00.000Z',
    mrr_cents: 1900,
    plan: { id: 'plan-1', code: 'PRO', name: 'Offre Pro' },
    organization: { id: 'org-1', name: 'Boulangerie Martin' },
    ...overrides,
  };
}

function membership(role: MembershipWithOrganization['role']): MembershipWithOrganization {
  return {
    id: 'mem-1',
    role,
    organization: {
      id: 'org-1',
      name: 'Boulangerie Martin',
      slug: 'boulangerie-martin',
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  };
}

beforeEach(() => {
  state.subscriptions = [];
  state.invoices = [];
  state.payments = [];
  state.memberships = [membership('OWNER')];
  state.plans = [];
});

describe('Retour du paiement', () => {
  it('annonce une confirmation en cours, jamais un succès', async () => {
    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />, {
      route: '/dashboard/facturation?paiement=retour',
    });

    expect(screen.getByText('Confirmation en cours')).toBeInTheDocument();

    // Aucune affirmation de succès tant que le webhook n'a rien écrit (§20).
    expect(screen.queryByText(/paiement réussi/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Actif')).not.toBeInTheDocument();
  });

  it('dit qu’un abandon n’a rien prélevé', async () => {
    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />, {
      route: '/dashboard/facturation?paiement=annule',
    });

    expect(screen.getByText('Paiement interrompu')).toBeInTheDocument();
    expect(screen.getByText(/Rien n’a été prélevé/)).toBeInTheDocument();
  });
});

describe('Abonnement en cours', () => {
  it('affiche le montant réellement facturé et la prochaine échéance', async () => {
    state.subscriptions = [subscription()];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(screen.getByText('Offre Pro')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText(/19,00/)).toBeInTheDocument();
    expect(screen.getByText('Prochaine échéance')).toBeInTheDocument();
  });

  it('annonce une fin, non un renouvellement, quand la résiliation est programmée', async () => {
    state.subscriptions = [subscription({ cancel_at_period_end: true })];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(screen.getByText('Résiliation programmée')).toBeInTheDocument();
    expect(screen.getByText('Prend fin le')).toBeInTheDocument();
    expect(screen.queryByText('Prochaine échéance')).not.toBeInTheDocument();
  });

  it('n’invente pas de montant quand Stripe n’en fournit pas', async () => {
    state.subscriptions = [
      subscription({ unit_amount_cents: null, recurring_interval: null }),
    ];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(screen.getByText(/Montant non communiqué/)).toBeInTheDocument();
    expect(screen.queryByText(/0,00/)).not.toBeInTheDocument();
  });
});

describe('Rôle dans l’entreprise', () => {
  it('explique au non-dirigeant pourquoi il ne voit pas de facture', async () => {
    state.memberships = [membership('MEMBER')];
    state.subscriptions = [subscription()];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(screen.getByText('Réservé au dirigeant')).toBeInTheDocument();
    // Le portail Stripe engage la facturation : il n'est pas proposé.
    expect(
      screen.queryByRole('button', { name: /Gérer mon abonnement/ }),
    ).not.toBeInTheDocument();
  });

  it('propose le portail Stripe au dirigeant', async () => {
    state.subscriptions = [subscription()];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(
      screen.getByRole('button', { name: /Gérer mon abonnement/ }),
    ).toBeInTheDocument();
  });
});

describe('Souscription', () => {
  it('ne propose aucun bouton quand le catalogue Stripe est absent', async () => {
    // `stripe_price_id` NULL partout : `isPurchasable` renvoie false, et un
    // bouton « Souscrire » mènerait à une erreur Stripe (§57).
    state.plans = [
      {
        id: 'plan-1',
        code: 'PRO',
        name: 'Offre Pro',
        tagline: null,
        description: null,
        requires_quote: false,
        is_featured: false,
        sort_order: 1,
        stripe_product_id: null,
        plan_prices: [
          {
            id: 'price-1',
            kind: 'RECURRING',
            recurring_interval: 'month',
            unit_amount_cents: 1900,
            currency: 'EUR',
            is_starting_price: false,
            stripe_price_id: null,
          },
        ],
        plan_features: [],
      },
    ];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(screen.getByText('Souscription en ligne indisponible')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Souscrire' })).not.toBeInTheDocument();
  });

  it('propose la souscription quand le prix existe chez Stripe', async () => {
    state.plans = [
      {
        id: 'plan-1',
        code: 'PRO',
        name: 'Offre Pro',
        tagline: null,
        description: null,
        requires_quote: false,
        is_featured: false,
        sort_order: 1,
        stripe_product_id: 'prod_123',
        plan_prices: [
          {
            id: 'price-1',
            kind: 'RECURRING',
            recurring_interval: 'month',
            unit_amount_cents: 1900,
            currency: 'EUR',
            is_starting_price: false,
            stripe_price_id: 'price_123',
          },
        ],
        plan_features: [],
      },
    ];

    const { FacturationPage } = await import('./FacturationPage');
    renderWithProviders(<FacturationPage />);

    expect(screen.getByRole('button', { name: 'Souscrire' })).toBeInTheDocument();
  });
});
