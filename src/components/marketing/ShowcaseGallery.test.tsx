import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery component', () => {
  it('affiche le titre principal, les filtres et les 4 écrans d’exposition', () => {
    renderWithProviders(<ShowcaseGallery />);

    expect(
      screen.getByText('Des expériences digitales pensées pour votre activité.')
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'SOIN & BEAUTÉ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ARTISAN & BTP' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RESTAURATION' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'IMMOBILIER' })).toBeInTheDocument();

    expect(screen.getByText('SOIE & TERRE')).toBeInTheDocument();
    expect(screen.getByText('KAYO CONSTRUCTION')).toBeInTheDocument();
    expect(screen.getByText('RACINES & BRAISE')).toBeInTheDocument();
    expect(screen.getByText('HORIZONS PRESTIGE')).toBeInTheDocument();
  });

  it('change le filtre actif au clic', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    const btpFilter = screen.getByRole('button', { name: 'ARTISAN & BTP' });
    await user.click(btpFilter);

    expect(btpFilter).toHaveClass('underline');
  });

  it('ouvre la vue immersive au clic sur une maquette', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    const firstCard = screen.getByText('SOIE & TERRE');
    await user.click(firstCard);

    expect(screen.getByText(/Retour au site HBG Labs/i)).toBeInTheDocument();
  });
});
