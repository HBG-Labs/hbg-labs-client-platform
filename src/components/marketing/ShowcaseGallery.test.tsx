import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery — Galerie de maquettes interactives', () => {
  it('affiche le projet initial par défaut et permet de changer de secteur', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Projet par défaut (Soins Beauté & Spa — Karay Beauty)
    expect(screen.getAllByText('Karay Beauty').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Rituels de soins caribéens/i).length).toBeGreaterThanOrEqual(1);

    // Changement d'onglet vers Gastronomie & Vins
    const gastroTab = screen.getByRole('button', { name: /Gastronomie & Vins/i });
    await user.click(gastroTab);

    expect(screen.getAllByText('Maison Sévérac').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Haute cuisine française/i).length).toBeGreaterThanOrEqual(1);
  });

  it('permet de basculer entre la vue ordinateur et la vue smartphone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Vue ordinateur par défaut (présence de la barre d'URL)
    expect(screen.getByText(/https:\/\/www.karaybeauty.fr/i)).toBeInTheDocument();

    // Bascule vers la vue mobile
    const mobileBtn = screen.getByRole('button', { name: /Mobile/i });
    await user.click(mobileBtn);

    expect(screen.getByText(/100 % Tactile & Fluide/i)).toBeInTheDocument();
  });
});
