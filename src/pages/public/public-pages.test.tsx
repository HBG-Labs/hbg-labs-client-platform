import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

/**
 * Tests de rendu des pages publiques.
 *
 * Le build et la compilation valident la syntaxe et les types. Ils ne disent
 * rien d'une erreur d'exécution : un composant Radix mal assemblé, une valeur
 * nulle déréférencée au rendu, une importation circulaire. Ces tests montent
 * réellement chaque page dans un DOM.
 *
 * Les accès réseau sont interceptés au niveau du SERVICE, pas du client
 * Supabase. Simuler la couche service garde le test rapide et déterministe, et
 * le chemin d'écriture réel est vérifié séparément contre la vraie base par la
 * suite RLS.
 */

vi.mock('@/services/plans.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/plans.service')>();

  return {
    ...actual,
    fetchPublicPlans: vi.fn(async () => [
      {
        id: 'plan-pro',
        code: 'PRO',
        name: 'Pro',
        tagline: 'Votre site, entretenu au quotidien.',
        description: null,
        requires_quote: false,
        is_featured: true,
        sort_order: 20,
        stripe_product_id: null,
        plan_prices: [
          {
            id: 'price-monthly',
            kind: 'RECURRING' as const,
            recurring_interval: 'month' as const,
            unit_amount_cents: 4900,
            currency: 'EUR',
            is_starting_price: false,
            stripe_price_id: null,
          },
          {
            id: 'price-setup',
            kind: 'ONE_TIME' as const,
            recurring_interval: null,
            unit_amount_cents: 89000,
            currency: 'EUR',
            is_starting_price: true,
            stripe_price_id: null,
          },
        ],
        plan_features: [
          {
            id: 'feature-1',
            label: 'Maintenance continue',
            is_included: true,
            detail: null,
            sort_order: 10,
          },
          {
            id: 'feature-2',
            label: 'Fonctionnalités sur mesure',
            is_included: false,
            detail: null,
            sort_order: 20,
          },
        ],
      },
    ]),
  };
});

// Signature variadique : TanStack Query appelle mutationFn avec (variables,
// contexte), soit un argument de plus que la fonction de service n'en déclare.
const submitQuoteRequest = vi.fn(async (..._args: unknown[]): Promise<void> => undefined);
vi.mock('@/services/leads.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/leads.service')>();
  return {
    ...actual,
    submitQuoteRequest: (...args: unknown[]) => submitQuoteRequest(...args),
    submitContactMessage: vi.fn(async () => undefined),
  };
});

beforeEach(() => {
  submitQuoteRequest.mockClear();
});

describe('Page d’accueil', () => {
  it('affiche le message principal en titre de niveau 1', async () => {
    const { HomePage } = await import('./HomePage');
    renderWithProviders(<HomePage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Votre activité mérite sa propre allure.');
  });

  it('ne comporte qu’un seul titre de niveau 1', async () => {
    const { HomePage } = await import('./HomePage');
    renderWithProviders(<HomePage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('affiche les tarifs venus de la base, jamais codés en dur', async () => {
    const { HomePage } = await import('./HomePage');
    renderWithProviders(<HomePage />);

    // 4900 centimes formatés en euros.
    expect(await screen.findByText('49 €')).toBeInTheDocument();
  });

  it('porte la mention « à partir de » sur un prix de départ', async () => {
    const { HomePage } = await import('./HomePage');
    renderWithProviders(<HomePage />);

    // §7 : la mention est obligatoire quand is_starting_price vaut true.
    expect(await screen.findByText(/à partir de/i)).toBeInTheDocument();
  });

  it('n’affiche aucun témoignage', async () => {
    // Aucun avis client réel n'existe. La règle 03-frontend §8.10 interdit d'en
    // inventer, ce test empêche qu'on en réintroduise par inadvertance.
    const { HomePage } = await import('./HomePage');
    renderWithProviders(<HomePage />);

    expect(screen.queryByText(/témoignage/i)).not.toBeInTheDocument();
  });

  it('déplie une réponse de la foire aux questions', async () => {
    const user = userEvent.setup();
    const { HomePage } = await import('./HomePage');
    renderWithProviders(<HomePage />);

    const question = screen.getByText('Suis-je propriétaire de mon nom de domaine ?');
    await user.click(question);

    expect(
      screen.getByText(/Le domaine est enregistré à votre nom/i),
    ).toBeVisible();
  });
});

describe('Page tarifs', () => {
  it('affiche la grille et son avertissement sur les montants', async () => {
    const { TarifsPage } = await import('./TarifsPage');
    renderWithProviders(<TarifsPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Un investissement clair. Un accompagnement qui dure.',
    );
    expect(await screen.findByText('Pro')).toBeInTheDocument();
    expect(screen.getByText(/Comprendre les montants affichés/i)).toBeInTheDocument();
  });

  it('signale qu’une caractéristique n’est pas incluse, hors de la seule icône', async () => {
    const { TarifsPage } = await import('./TarifsPage');
    renderWithProviders(<TarifsPage />);

    await screen.findByText('Fonctionnalités sur mesure');
    expect(screen.getByText('non inclus')).toBeInTheDocument();
  });
});

describe('Formulaire de devis', () => {
  it('refuse un envoi vide et signale les champs manquants', async () => {
    const user = userEvent.setup();
    const { DevisPage } = await import('./DevisPage');
    renderWithProviders(<DevisPage />, { route: '/devis' });

    await user.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

    // Un champ non rempli vaut '' et non undefined : c'est la règle min() qui
    // se déclenche, pas required_error. Les messages sont écrits pour ce cas.
    expect(
      await screen.findByText('Renseignez votre nom et prénom.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Décrivez votre projet en quelques mots (10 caractères minimum).'),
    ).toBeInTheDocument();
    expect(submitQuoteRequest).not.toHaveBeenCalled();
  });

  it('rejette une adresse électronique mal formée', async () => {
    const user = userEvent.setup();
    const { DevisPage } = await import('./DevisPage');
    renderWithProviders(<DevisPage />, { route: '/devis' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(screen.getByLabelText(/Adresse électronique/), 'pas-une-adresse');
    await user.type(
      screen.getByLabelText(/Votre projet/),
      'Je souhaite un site vitrine pour ma boulangerie.',
    );
    await user.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

    expect(
      await screen.findByText('Cette adresse électronique n’est pas valide.'),
    ).toBeInTheDocument();
    expect(submitQuoteRequest).not.toHaveBeenCalled();
  });

  it('envoie la demande et confirme la réception', async () => {
    const user = userEvent.setup();
    const { DevisPage } = await import('./DevisPage');
    renderWithProviders(<DevisPage />, { route: '/devis' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Marie Dupont');
    await user.type(
      screen.getByLabelText(/Adresse électronique/),
      'Marie.Dupont@Exemple.FR',
    );
    await user.type(
      screen.getByLabelText(/Votre projet/),
      'Je souhaite un site vitrine pour ma boulangerie de Fort-de-France.',
    );
    await user.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

    await waitFor(() => expect(submitQuoteRequest).toHaveBeenCalledTimes(1));

    // TanStack Query appelle mutationFn avec (variables, contexte) : on
    // inspecte le premier argument plutôt que la signature entière.
    const payload = submitQuoteRequest.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;

    // L'adresse est normalisée en minuscules par le schéma, comme l'exige la
    // contrainte `quote_requests_email_lowercase` de la migration 15.
    expect(payload?.email).toBe('marie.dupont@exemple.fr');

    // Les listes déroulantes laissées vides ne partent pas en chaîne vide :
    // les contraintes CHECK de la migration 15 la refuseraient.
    expect(payload?.project_type).toBeUndefined();
    expect(payload?.budget_range).toBeUndefined();
    expect(payload?.phone).toBeUndefined();

    expect(
      await screen.findByRole('heading', { name: /Votre demande est bien arrivée/i }),
    ).toBeInTheDocument();
  });
});

describe('Pages légales', () => {
  it('affiche les mentions légales et l’identité de l’entreprise', async () => {
    const { MentionsLegalesPage } = await import('./MentionsLegalesPage');
    renderWithProviders(<MentionsLegalesPage />);

    expect(screen.getByRole('heading', { name: /Mentions légales/i })).toBeInTheDocument();
    expect(screen.getByText('10919844000017')).toBeInTheDocument();
    expect(screen.getAllByText(/Vercel Inc\./i).length).toBeGreaterThan(0);
  });

  it('affiche la politique de confidentialité et les droits RGPD', async () => {
    const { PolitiqueConfidentialitePage } = await import('./PolitiqueConfidentialitePage');
    renderWithProviders(<PolitiqueConfidentialitePage />);

    expect(screen.getByRole('heading', { name: /Politique de confidentialité/i })).toBeInTheDocument();
    expect(screen.getAllByText(/hbglabs@gmail\.com/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CNIL/i).length).toBeGreaterThan(0);
  });

  it('affiche les CGU, CGV et la politique des cookies', async () => {
    const { CguPage } = await import('./CguPage');
    const { CgvPage } = await import('./CgvPage');
    const { CookiesPage } = await import('./CookiesPage');

    const { unmount: unmountCgu } = renderWithProviders(<CguPage />);
    expect(screen.getByRole('heading', { name: /Conditions générales d’utilisation/i })).toBeInTheDocument();
    unmountCgu();

    const { unmount: unmountCgv } = renderWithProviders(<CgvPage />);
    expect(screen.getByRole('heading', { name: /Conditions générales de vente/i })).toBeInTheDocument();
    unmountCgv();

    renderWithProviders(<CookiesPage />);
    expect(screen.getByRole('heading', { name: /Politique relative aux cookies/i })).toBeInTheDocument();
  });
});
