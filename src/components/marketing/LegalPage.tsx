import { Alert } from '@/components/ui/Alert';
import { Container, Section } from '@/components/ui/Layout';
import { missingLegalFields } from '@/config/site';

/**
 * Gabarit des pages légales.
 *
 * Ces pages engagent juridiquement HBG Labs. Elles ne doivent contenir aucune
 * information approximative : un SIRET ou une raison sociale inventés
 * constituent une fausse déclaration, et le visiteur n'a aucun moyen de
 * repérer la substitution.
 *
 * Quand `src/config/site.ts` est incomplet, un avertissement remplace les
 * mentions concernées et énumère précisément ce qui reste à fournir.
 */

export interface LegalPageProps {
  title: string;
  /** Date de dernière mise à jour, au format ISO. */
  updatedAt: string;
  /** Affiche l'avertissement de publication incomplète. */
  requiresLegalIdentity?: boolean;
  children: React.ReactNode;
}

export function LegalPage({
  title,
  updatedAt,
  requiresLegalIdentity = false,
  children,
}: LegalPageProps) {
  const missing = requiresLegalIdentity ? missingLegalFields() : [];

  return (
    <Section>
      <Container width="narrow">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>

        <p className="mt-3 text-sm text-muted">
          Dernière mise à jour :{' '}
          <time dateTime={updatedAt}>
            {new Intl.DateTimeFormat('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(updatedAt))}
          </time>
        </p>

        {missing.length > 0 && (
          <Alert tone="warning" title="Publication incomplète" className="mt-8">
            <p>
              Les informations suivantes doivent être renseignées dans
              <code className="mx-1 rounded bg-surface-muted px-1 py-0.5 text-xs">
                src/config/site.ts
              </code>
              avant la mise en ligne :
            </p>
            <ul className="mt-2 list-inside list-disc space-y-0.5">
              {missing.map((field) => (
                <li key={field.key}>{field.label}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="legal-content mt-10">{children}</div>
      </Container>
    </Section>
  );
}

/** Section de page légale, avec son titre de niveau 2. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/** Valeur légale, ou mention explicite de son absence. */
export function LegalValue({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label} : </span>
      {value ? (
        value
      ) : (
        <span className="italic text-warning">à compléter</span>
      )}
    </p>
  );
}
