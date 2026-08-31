import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { InteractiveHero } from './InteractiveHero';

describe('InteractiveHero component', () => {
  it('rend le titre principal et les boutons d’action', () => {
    renderWithProviders(<InteractiveHero />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent("Créer l'impossible");

    const startBtn = screen.getByRole('link', { name: /Démarrer un projet/i });
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).toHaveAttribute('href', '/devis');

    const pricingBtn = screen.getByRole('link', { name: /Découvrir les offres/i });
    expect(pricingBtn).toBeInTheDocument();
    expect(pricingBtn).toHaveAttribute('href', '/tarifs');
  });

  it('monte la balise vidéo avec les attributs requis pour le contrôle interactif', () => {
    const { container } = renderWithProviders(
      <InteractiveHero videoSrc="/videos/no_flying_bugs.mp4" />
    );

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/videos/no_flying_bugs.mp4');
  });

  it('monte la section principale interactive', () => {
    renderWithProviders(<InteractiveHero />);

    const section = screen.getByLabelText(/Présentation principale interactive/i);
    expect(section).toBeInTheDocument();
  });
});
