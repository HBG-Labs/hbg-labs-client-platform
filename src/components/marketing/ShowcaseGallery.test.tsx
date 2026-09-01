import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery — Galerie de maquettes interactives', () => {
  it('affiche le projet initial par défaut et permet de changer de secteur', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Projet par défaut (Gastronomie)
    expect(screen.getAllByText('Maison Sévérac').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Haute cuisine française/i).length).toBeGreaterThanOrEqual(1);

    // Changement d'onglet vers Architecture
    const archiTab = screen.getByRole('button', { name: /Architecture & Design/i });
    await user.click(archiTab);

    expect(screen.getAllByText('Studio Vaneau').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Architecture d’intérieur/i).length).toBeGreaterThanOrEqual(1);
  });

  it('permet de basculer entre la vue ordinateur et la vue smartphone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    // Vue ordinateur par défaut (présence de la barre d'URL)
    expect(screen.getByText(/https:\/\/www.maison-severac.fr/i)).toBeInTheDocument();

    // Bascule vers la vue mobile
    const mobileBtn = screen.getByRole('button', { name: /Mobile/i });
    await user.click(mobileBtn);

    expect(screen.getByText(/100 % Tactile & Fluide/i)).toBeInTheDocument();
  });
});
