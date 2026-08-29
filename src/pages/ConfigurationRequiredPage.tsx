/**
 * Écran affiché quand la configuration client est incomplète.
 *
 * Ce composant n'importe NI `@/lib/supabase`, NI aucun module qui en dépend :
 * c'est précisément la situation où le client Supabase ne peut pas être
 * construit. Il se suffit à lui-même, avec des styles en ligne, pour rester
 * affichable même si la feuille de style ne s'est pas chargée.
 */
export function ConfigurationRequiredPage({ issues }: { issues: readonly string[] }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: '#0b1220',
        color: '#e2e8f0',
      }}
    >
      <div style={{ maxWidth: '40rem', width: '100%' }}>
        <p
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#64748b',
            marginBottom: '0.75rem',
          }}
        >
          HBG Labs · Plateforme Client
        </p>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Configuration requise
        </h1>

        <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          La connexion à Supabase doit être configurée pour démarrer l’application.
          En l’absence de base active, l’interface reste verrouillée sans données factices.
        </p>

        <div
          style={{
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            backgroundColor: '#111c2e',
          }}
        >
          <p style={{ fontWeight: 500, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            {issues.length === 1 ? 'Variable manquante' : 'Variables manquantes'}
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#f87171' }}>
            {issues.map((issue) => (
              <li key={issue} style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                {issue}
              </li>
            ))}
          </ul>
        </div>

        <ol style={{ color: '#94a3b8', lineHeight: 1.9, paddingLeft: '1.25rem', margin: 0 }}>
          <li>
            Créez un projet sur{' '}
            <a href="https://supabase.com/dashboard" style={{ color: '#60a5fa' }}>
              supabase.com
            </a>{' '}
            (offre gratuite, quelques minutes).
          </li>
          <li>
            Copiez <code style={{ color: '#e2e8f0' }}>.env.example</code> vers{' '}
            <code style={{ color: '#e2e8f0' }}>.env</code>.
          </li>
          <li>
            Renseignez l’URL et la clé <em>anon</em> depuis Project Settings → API Keys.
          </li>
          <li>Relancez le serveur de développement.</li>
        </ol>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Marche à suivre détaillée&nbsp;: <code>docs/SETUP.md</code>
        </p>
      </div>
    </main>
  );
}
