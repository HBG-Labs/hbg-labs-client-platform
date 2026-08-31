import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { CookieBanner } from './CookieBanner';
import { CookiePreferencesModal } from './CookiePreferencesModal';

describe('CookieBanner et gestionnaire de consentement', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('s’affiche lorsque aucun consentement n’est encore enregistré', () => {
    renderWithProviders(<CookieBanner />);

    expect(
      screen.getByRole('complementary', { name: /Gestion des cookies et traceurs/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tout accepter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tout refuser/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Personnaliser/i })).toBeInTheDocument();
  });

  it('enregistre l’acceptation globale et masque le bandeau au clic sur « Tout accepter »', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CookieBanner />);

    const acceptBtn = screen.getByRole('button', { name: /Tout accepter/i });
    await user.click(acceptBtn);

    expect(
      screen.queryByRole('complementary', { name: /Gestion des cookies et traceurs/i }),
    ).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('hbg_cookie_consent_v1') || '{}');
    expect(stored.preferences.necessary).toBe(true);
    expect(stored.preferences.analytics).toBe(true);
    expect(stored.preferences.marketing).toBe(true);
  });

  it('enregistre le refus des traceurs optionnels au clic sur « Tout refuser »', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CookieBanner />);

    const rejectBtn = screen.getByRole('button', { name: /Tout refuser/i });
    await user.click(rejectBtn);

    expect(
      screen.queryByRole('complementary', { name: /Gestion des cookies et traceurs/i }),
    ).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('hbg_cookie_consent_v1') || '{}');
    expect(stored.preferences.necessary).toBe(true);
    expect(stored.preferences.analytics).toBe(false);
    expect(stored.preferences.marketing).toBe(false);
  });

  it('ouvre le centre de préférences au clic sur « Personnaliser »', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CookieBanner />
        <CookiePreferencesModal />
      </>,
    );

    const customizeBtn = screen.getByRole('button', { name: /Personnaliser/i });
    await user.click(customizeBtn);

    expect(
      screen.getByRole('heading', { name: /Préférences relatives aux cookies/i }),
    ).toBeInTheDocument();
  });
});
