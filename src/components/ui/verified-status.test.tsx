import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerifiedStatusBadge, StatusBadge } from './StatusBadge';
import { UNVERIFIED_LABEL } from '@/types/domain';

/**
 * La règle du faux voyant (§17, §57).
 *
 * C'est la contrainte de fiabilité la plus visible de la plateforme, et la
 * plus facile à contourner par distraction : il suffit d'écrire
 * `status === 'ONLINE' ? '🟢 En ligne' : …` dans un composant pour annoncer
 * au client un état que personne n'a vérifié.
 *
 * Ces tests figent le comportement du composant qui applique la règle. Ils
 * complètent les contraintes CHECK des migrations 05 et 06, qui empêchent la
 * base d'enregistrer un statut affirmatif sans source : la protection existe
 * des deux côtés.
 */

describe('VerifiedStatusBadge', () => {
  it('affiche « Vérification non configurée » quand aucune source n’existe', () => {
    render(
      <VerifiedStatusBadge source="NONE" checkedAt={null} label="En ligne" tone="success" />,
    );

    expect(screen.getByText(UNVERIFIED_LABEL)).toBeInTheDocument();
    // Le libellé affirmatif ne doit apparaître nulle part.
    expect(screen.queryByText('En ligne')).not.toBeInTheDocument();
  });

  it('ignore le libellé et le ton demandés tant que rien n’est vérifié', () => {
    // Même en demandant explicitement un voyant vert, le composant refuse :
    // c'est ce qui rend la règle difficile à contourner par inadvertance.
    render(
      <VerifiedStatusBadge source="NONE" checkedAt={null} label="Actif" tone="success" />,
    );

    expect(screen.queryByText('Actif')).not.toBeInTheDocument();
    expect(screen.getByText(UNVERIFIED_LABEL)).toBeInTheDocument();
  });

  it('affiche l’état réel une fois la vérification faite', () => {
    render(
      <VerifiedStatusBadge
        source="VERCEL_API"
        checkedAt="2026-08-28T10:00:00.000Z"
        label="En ligne"
        tone="success"
      />,
    );

    expect(screen.getByText('En ligne')).toBeInTheDocument();
    expect(screen.queryByText(UNVERIFIED_LABEL)).not.toBeInTheDocument();
  });

  it('indique la provenance et la date en infobulle', () => {
    render(
      <VerifiedStatusBadge
        source="MANUAL"
        checkedAt="2026-08-28T10:00:00.000Z"
        label="Configuré"
        tone="success"
      />,
    );

    const badge = screen.getByText('Configuré').closest('span');
    expect(badge).toHaveAttribute(
      'title',
      expect.stringContaining('Vérifié manuellement par HBG Labs'),
    );
  });
});

describe('StatusBadge', () => {
  it('affiche un état interne sans exiger de vérification', () => {
    // Un statut de ticket ou d'abonnement ne dépend d'aucune sonde externe :
    // il n'a pas à passer par le composant vérifié.
    render(<StatusBadge tone="success" label="Résolue" />);
    expect(screen.getByText('Résolue')).toBeInTheDocument();
  });
});
