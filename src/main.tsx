import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { envIssues } from './lib/env';
import { ConfigurationRequiredPage } from './pages/ConfigurationRequiredPage';
import './index.css';

/**
 * Point d'entrée.
 *
 * La configuration est vérifiée AVANT de charger l'application. Le chargement
 * est dynamique pour que `@/lib/supabase` — qui construit le client et exige
 * une URL valide — ne soit jamais évalué avec une configuration incomplète.
 *
 * L'ordre importe : un import statique de `App` serait résolu au chargement du
 * module, donc avant que la moindre ligne de ce fichier ne s'exécute.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Élément #root introuvable dans index.html.');
}

const root = createRoot(rootElement);

if (envIssues.length > 0) {
  root.render(
    <StrictMode>
      <ConfigurationRequiredPage issues={envIssues} />
    </StrictMode>,
  );
} else {
  void import('./App').then(({ App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
