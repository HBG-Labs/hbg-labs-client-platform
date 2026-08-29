import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Layout';

/**
 * Appel à l'action de fin de page (§6, section 13).
 *
 * Les deux libellés viennent de §6 : « Créer mon site » en principal,
 * « Demander un devis » en secondaire. Les deux mènent au formulaire de devis,
 * seul parcours réellement disponible tant que le paiement en ligne n'est pas
 * en place.
 */
export interface CtaBannerProps {
  title?: string;
  description?: string;
}

export function CtaBanner({
  title = 'Parlons de votre projet',
  description = 'Décrivez votre besoin en quelques lignes. Nous revenons vers vous avec une proposition chiffrée, sans engagement.',
}: CtaBannerProps) {
  return (
    <Section tone="muted">
      <Container>
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted">
            {description}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/devis">Créer mon site</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
