import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShowcaseGallery } from './ShowcaseGallery';

describe('ShowcaseGallery component', () => {
  it('affiche le titre de page et les deux concepts identifiés comme démonstrations', () => {
    renderWithProviders(<ShowcaseGallery asPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Le web prend du caractère.' })
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Tout voir' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Créations de démonstration du studio/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'SOIE & TERRE' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'KAYO CONSTRUCTION' })).toBeInTheDocument();
  });

  it('s’intègre à l’accueil sans ajouter de titre h1', () => {
    renderWithProviders(<ShowcaseGallery />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Le web prend du caractère.' })).toBeInTheDocument();
  });

  it('filtre réellement les concepts puis restaure la sélection complète', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    const btpFilter = screen.getByRole('button', { name: 'Artisan & BTP' });
    await user.click(btpFilter);

    expect(btpFilter).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tout voir' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Découvrir la maquette KAYO CONSTRUCTION' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Découvrir la maquette SOIE & TERRE' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 concept à découvrir');

    await user.click(screen.getByRole('button', { name: 'Soin & Beauté' }));
    expect(screen.getByRole('button', { name: 'Découvrir la maquette SOIE & TERRE' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Découvrir la maquette KAYO CONSTRUCTION' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tout voir' }));
    expect(screen.getAllByRole('button', { name: /Découvrir la maquette/ })).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 concepts à découvrir');
  });

  it('ouvre le bon concept et permet de changer le format d’aperçu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);

    await user.click(screen.getByRole('button', { name: 'Découvrir la maquette KAYO CONSTRUCTION' }));
    const viewer = within(screen.getByRole('dialog', { name: 'Maquette KAYO CONSTRUCTION' }));
    expect(viewer.getByRole('button', { name: 'Aperçu ordinateur' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(viewer.getByRole('button', { name: 'Aperçu mobile' }));
    expect(viewer.getByRole('button', { name: 'Aperçu mobile' })).toHaveAttribute('aria-pressed', 'true');
    expect(viewer.getByRole('button', { name: 'Aperçu ordinateur' })).toHaveAttribute('aria-pressed', 'false');
    expect(viewer.getByRole('link', { name: /Créer mon site similaire/ })).toHaveAttribute('href', '/devis?concept=kayo-construction');
    await user.click(viewer.getByRole('button', { name: 'Fermer la vue immersive' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('s’ouvre au clavier, se ferme par Échap et rend le focus à la carte', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShowcaseGallery />);
    const card = screen.getByRole('button', { name: 'Découvrir la maquette SOIE & TERRE' });
    card.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Maquette SOIE & TERRE' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(card).toHaveFocus());
  });
});
