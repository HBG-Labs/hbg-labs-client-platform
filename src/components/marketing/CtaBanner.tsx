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
        <div className="rounded-3xl border border-border bg-surface px-8 py-16 text-center sm:px-16">
          <h2 className="text-balance font-serif font-normal text-3xl sm:text-5xl text-ink tracking-tight">
            {title}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-pretty font-sans text-[15px] sm:text-base leading-relaxed text-muted">
            {description}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="primary" className="px-10">
              <Link to="/devis">Créer mon site</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-10">
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
