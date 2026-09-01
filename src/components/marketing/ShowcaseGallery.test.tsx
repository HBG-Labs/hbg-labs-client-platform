import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery component', () => {
  it('affiche le titre principal et le premier projet par défaut', () => {
    renderWithProviders(<ShowcaseGallery />);

    expect(
      screen.getByText('Des expériences digitales pensées pour votre activité.')
    ).toBeInTheDocument();

    expect(screen.getByText('SOIE & TERRE')).toBeInTheDocument();
    expect(screen.queryByText('Tous')).not.toBeInTheDocument();
  });

  it('bascule entre les univers métiers au clic sur les filtres', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Test BTP
    const btpFilter = screen.getByRole('button', { name: 'Artisan & BTP' });
    await user.click(btpFilter);

    expect(screen.getByText('KAYO CONSTRUCTION')).toBeInTheDocument();
    expect(screen.queryByText('SOIE & TERRE')).not.toBeInTheDocument();

    // Test Restauration
    const restoFilter = screen.getByRole('button', { name: 'Restauration' });
    await user.click(restoFilter);

    expect(screen.getByText('RACINES & BRAISE')).toBeInTheDocument();
    expect(screen.queryByText('KAYO CONSTRUCTION')).not.toBeInTheDocument();

    // Test Immobilier
    const realEstateFilter = screen.getByRole('button', { name: 'Immobilier' });
    await user.click(realEstateFilter);

    expect(screen.getByText('HORIZONS PRESTIGE')).toBeInTheDocument();
    expect(screen.queryByText('RACINES & BRAISE')).not.toBeInTheDocument();
  });

  it('ouvre la vue immersive au clic sur Voir le projet', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    const viewButtons = screen.getAllByRole('button', { name: /Voir le projet/i });
    expect(viewButtons.length).toBeGreaterThan(0);

    const firstButton = viewButtons[0];
    if (firstButton) {
      await user.click(firstButton);
    }

    expect(screen.getByText(/Retour au site HBG Labs/i)).toBeInTheDocument();
  });
});
