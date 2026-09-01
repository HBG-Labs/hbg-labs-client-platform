import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery component', () => {
  it('affiche le titre principal et les 4 projets phares', () => {
    renderWithProviders(<ShowcaseGallery />);

    expect(
      screen.getByText('Des expériences digitales pensées pour votre activité.')
    ).toBeInTheDocument();

    expect(screen.getByText('SOIE & TERRE')).toBeInTheDocument();
    expect(screen.getByText('KAYO CONSTRUCTION')).toBeInTheDocument();
    expect(screen.getByText('RACINES & BRAISE')).toBeInTheDocument();
    expect(screen.getByText('HORIZONS PRESTIGE')).toBeInTheDocument();
  });

  it('filtre les projets selon la catégorie sélectionnée', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    const btpFilter = screen.getByRole('button', { name: 'Artisan & BTP' });
    await user.click(btpFilter);

    expect(screen.getByText('KAYO CONSTRUCTION')).toBeInTheDocument();
    expect(screen.queryByText('SOIE & TERRE')).not.toBeInTheDocument();
    expect(screen.queryByText('RACINES & BRAISE')).not.toBeInTheDocument();
    expect(screen.queryByText('HORIZONS PRESTIGE')).not.toBeInTheDocument();
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
