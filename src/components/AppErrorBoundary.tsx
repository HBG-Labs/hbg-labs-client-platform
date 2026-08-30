import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '@/lib/monitoring';

/**
 * Dernier filet : une erreur de rendu non rattrapée (§17).
 *
 *
 * POURQUOI UN ÉCRAN PLUTÔT QU'UNE PAGE BLANCHE
 *
 * Sans limite d'erreur, React 19 démonte tout l'arbre : l'utilisateur obtient
 * une page blanche, sans message, sans bouton, sans indication de ce qu'il peut
 * faire. La cause n'apparaît que dans la console du navigateur, que personne
 * n'ouvre.
 *
 *
 * AUCUNE DÉPENDANCE AU RESTE DE L'INTERFACE
 *
 * Ce composant n'importe ni le design system, ni le routeur, ni les
 * fournisseurs de contexte. Il se déclenche précisément quand quelque chose
 * vient d'échouer : s'appuyer sur un module qui peut faire partie de la panne
 * produirait une seconde erreur, cette fois sans rien pour la rattraper.
 *
 * Le message réel est affiché, jamais remplacé par un texte rassurant — même
 * règle que `ErrorState`. Une erreur masquée est une erreur qui persiste.
 */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // La pile de composants dit OÙ l'erreur s'est produite ; elle ne contient
    // que des noms de composants, aucune donnée client.
    reportError(error, { composants: info.componentStack ?? 'inconnue' });
  }

  render(): ReactNode {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: '#f9fafb',
          color: '#111827',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
            L’application a rencontré une erreur
          </h1>

          <p style={{ margin: '0 0 1rem', lineHeight: 1.6, color: '#4b5563' }}>
            Rien n’a été perdu : cette page n’a pas pu s’afficher, vos données sont
            intactes. Rechargez pour reprendre là où vous en étiez.
          </p>

          <p
            style={{
              margin: '0 0 1.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              fontSize: '0.8125rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#6b7280',
              textAlign: 'left',
              overflowWrap: 'anywhere',
            }}
          >
            {error.message}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              minHeight: '2.75rem',
              padding: '0 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#1d4ed8',
              color: '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}
