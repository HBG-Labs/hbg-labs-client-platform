import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ProcessStepItem {
  step: string;
  title: string;
  description: string;
}

interface ProcessMarqueeProps {
  steps: ProcessStepItem[];
  className?: string;
}

/**
 * Composant de défilement latéral automatique et interactif.
 * - Déplacement automatique continu de droite à gauche.
 * - Lors du scroll vers le bas : accélération vers la gauche.
 * - Lors du scroll vers le haut : déplacement inversé vers la droite.
 * - Boucle infinie fluide basée sur requestAnimationFrame sans scintillement.
 */
export function ProcessMarquee({ steps, className }: ProcessMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 4 répétitions pour garantir une boucle infinie parfaitement fluide
  const repeatedSteps = [...steps, ...steps, ...steps, ...steps];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let animationFrameId: number;
    let xPos = 0;
    const baseSpeed = -0.9; // Vitesse de base continue vers la gauche
    let currentVelocity = baseSpeed;
    let targetVelocity = baseSpeed;
    let lastScrollY = window.scrollY;
    let ticking = false;

    // Détection de la direction et de la vélocité du scroll
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY;
          lastScrollY = currentScrollY;

          // Si on scroll vers le bas (scrollDelta > 0) -> accélération vers la gauche (valeur négative)
          // Si on scroll vers le haut (scrollDelta < 0) -> mouvement vers la droite (valeur positive)
          const scrollImpulse = -scrollDelta * 0.35;
          targetVelocity = baseSpeed + scrollImpulse;

          // Limiter l'impulsion pour garder un mouvement élégant
          const maxVelocity = 12;
          if (targetVelocity > maxVelocity) targetVelocity = maxVelocity;
          if (targetVelocity < -maxVelocity) targetVelocity = -maxVelocity;

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Boucle d'animation principale 60fps / 120fps
    const loop = () => {
      // Retour progressif vers la vitesse de base (amortissement doux)
      targetVelocity += (baseSpeed - targetVelocity) * 0.04;
      currentVelocity += (targetVelocity - currentVelocity) * 0.1;

      const speedMultiplier = isHovered ? 0.3 : 1;
      xPos += currentVelocity * speedMultiplier;

      // Calcul de la largeur d'un cycle complet (1/4 du ruban total)
      const singleSetWidth = track.scrollWidth / 4;

      if (singleSetWidth > 0) {
        if (xPos <= -singleSetWidth) {
          xPos += singleSetWidth;
        } else if (xPos >= 0) {
          xPos -= singleSetWidth;
        }
      }

      track.style.transform = `translate3d(${xPos}px, 0, 0)`;
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHovered, steps.length]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden select-none py-2', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Masques de dégradé sur les bords pour un fondu élégant */}
      <div
        className="pointer-events-none absolute left-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-r from-surface-muted via-surface-muted/80 to-transparent z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-l from-surface-muted via-surface-muted/80 to-transparent z-10"
        aria-hidden="true"
      />

      {/* Ruban animé en translation continue */}
      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-6 w-max cursor-grab active:cursor-grabbing"
        style={{ willChange: 'transform' }}
      >
        {repeatedSteps.map((step, idx) => (
          <div
            key={`${step.step}-${idx}`}
            className="w-[260px] sm:w-[300px] md:w-[320px] shrink-0 rounded-none border border-stone-200 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-2xs hover:border-stone-400/80 transition-colors"
          >
            <div>
              <span className="font-serif text-3xl sm:text-4xl font-normal text-stone-400 select-none">
                {step.step}
              </span>
              <h3 className="mt-3 font-sans text-base sm:text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600 font-normal">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
