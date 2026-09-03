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
    <Section className="bg-[#e1e8df]">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_15%_100%,rgba(59,130,87,0.65),transparent_31%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.13),transparent_25%)]" />
          <h2 className="relative text-balance font-serif font-normal text-4xl text-white tracking-[-0.03em] sm:text-6xl">
            {title}
          </h2>

          <p className="relative mx-auto mt-5 max-w-2xl text-pretty font-sans text-[15px] leading-relaxed text-white/70 sm:text-base">
            {description}
          </p>

          <div className="relative mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="primary" className="bg-white px-10 text-ink hover:bg-brand-100">
              <Link to="/devis">Créer mon site</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 px-10 text-white hover:bg-white/10 hover:text-white">
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
