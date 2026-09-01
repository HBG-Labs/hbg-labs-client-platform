import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery — Galerie 3D et maquettes interactives', () => {
  it('affiche les cartes 3D et permet de changer de catégorie', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Catégorie active par défaut (Services)
    expect(screen.getAllByText('Services & Devis').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MAISON SÉVÉRAC').length).toBeGreaterThanOrEqual(1);

    // Clic sur la carte Sites Vitrines
    const vitrinesCard = screen.getAllByText('Sites Vitrines')[0]!;
    await user.click(vitrinesCard);

    expect(screen.getAllByText('STUDIO VANEAU').length).toBeGreaterThanOrEqual(1);
  });

  it('permet de basculer entre la vue grand écran et smartphone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Vue ordinateur par défaut
    expect(screen.getByText(/https:\/\/www.maison-severac.fr/i)).toBeInTheDocument();

    // Bascule vers la vue mobile
    const mobileBtn = screen.getByRole('button', { name: /Mobile/i });
    await user.click(mobileBtn);

    expect(screen.getByText(/100 % Tactile & Fluide/i)).toBeInTheDocument();
  });
});
