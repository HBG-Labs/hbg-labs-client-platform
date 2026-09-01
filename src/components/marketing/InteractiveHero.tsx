import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Layout';

interface InteractiveHeroProps {
  videoSrc?: string;
  posterSrc?: string;
}

/**
 * Hero section plein écran avec contrôle vidéo interactif au mouvement de la souris / tactile (§6).
 *
 * Fonctionnalités :
 * - Alignement et dimensions des boutons strictement identiques au mode classique.
 * - Cadrage centré et équilibré de la vidéo haute fidélité.
 * - Scrubbing fluide à 60 FPS synchronisé sur l'axe horizontal (X) de la souris ou du doigt.
 * - Curseur personnalisé rond unique, taille fixe, épuré avec glassmorphism.
 */
export function InteractiveHero({
  videoSrc = '/videos/no_flying_bugs.mp4',
}: InteractiveHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  // Valeurs cibles et courantes pour l'interpolation fluide du scrubbing vidéo
  const targetRatioRef = useRef(0);
  const currentRatioRef = useRef(0);
  const isDecoderPrimedRef = useRef(false);

  // Position physique du curseur rond personnalisé (LERP)
  const cursorTargetRef = useRef({ x: -100, y: -100 });
  const cursorCurrentRef = useRef({ x: -100, y: -100 });

  // Coordonnées pour la gestion tactile sur mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Amorçage du décodeur vidéo
  const primeDecoder = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDecoderPrimedRef.current) return;
    isDecoderPrimedRef.current = true;

    // Préchauffe le décodeur GPU du navigateur pour un scrubbing instantané
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          video.pause();
        })
        .catch(() => {
          video.pause();
        });
    }
  }, []);

  // Gestion du cycle de vie de la vidéo et de la boucle de rendu d'animation
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
      primeDecoder();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleLoadedData);

    if (video.readyState >= 2) {
      setIsVideoLoaded(true);
      primeDecoder();
    }

    let rafId: number | null = null;

    const renderLoop = () => {
      // 1. Scrubbing vidéo par interpolation LERP
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        const duration = video.duration;
        const diff = targetRatioRef.current - currentRatioRef.current;

        if (Math.abs(diff) > 0.0005) {
          currentRatioRef.current += diff * 0.2;
          const targetTime = currentRatioRef.current * duration;

          if ('fastSeek' in video && typeof (video as unknown as { fastSeek: (time: number) => void }).fastSeek === 'function') {
            (video as unknown as { fastSeek: (time: number) => void }).fastSeek(targetTime);
          } else {
            video.currentTime = targetTime;
          }
        } else if (currentRatioRef.current !== targetRatioRef.current) {
          currentRatioRef.current = targetRatioRef.current;
          video.currentTime = targetRatioRef.current * duration;
        }
      }

      // 2. Animation fluide du curseur rond suiveur
      const cursorEl = cursorRef.current;
      if (cursorEl) {
        const targetX = cursorTargetRef.current.x;
        const targetY = cursorTargetRef.current.y;
        const currentX = cursorCurrentRef.current.x;
        const currentY = cursorCurrentRef.current.y;

        const dx = targetX - currentX;
        const dy = targetY - currentY;

        cursorCurrentRef.current.x += dx * 0.22;
        cursorCurrentRef.current.y += dy * 0.22;

        cursorEl.style.transform = `translate3d(${cursorCurrentRef.current.x}px, ${cursorCurrentRef.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleLoadedData);
    };
  }, [primeDecoder]);

  // Écouteur sur les déplacements de souris : interactif uniquement lorsque le curseur est dans la section Hero
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInHero = (
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right
      );

      setIsCursorVisible(isInHero);

      // Le scrubbing vidéo et le curseur custom n'agissent QUE lorsque la souris est dans le Hero
      if (isInHero) {
        primeDecoder();
        const width = rect.width;
        if (width > 0) {
          const relativeX = e.clientX - rect.left;
          // Droite vers gauche : 0 -> 1 (début vers la fin)
          // Gauche vers droite : 1 -> 0 (recul vers le début)
          const normalizedRatio = Math.max(0, Math.min(1, 1 - (relativeX / width)));
          targetRatioRef.current = normalizedRatio;
        }

        // Mise à jour de la position du curseur custom
        cursorTargetRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseLeave = () => {
      setIsCursorVisible(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [primeDecoder]);

  // Support tactile mobile & tablette
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    primeDecoder();
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [primeDecoder]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    primeDecoder();
    const container = containerRef.current;
    if (!container || e.touches.length === 0) return;

    const touch = e.touches[0];
    if (!touch) return;

    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;

    if (width > 0) {
      const normalizedRatio = Math.max(0, Math.min(1, 1 - (x / width)));
      targetRatioRef.current = normalizedRatio;
    }
  }, [primeDecoder]);

  return (
    <section
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="relative min-h-[calc(100vh-52px)] min-h-[calc(100svh-52px)] w-full overflow-hidden flex items-start sm:items-center bg-background select-none md:cursor-none md:[&_*]:cursor-none"
      aria-label="Présentation principale interactive HBG Labs"
    >
      {/* ── Curseur Personnalisé Rond Stylé (desktop) ── */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-50 hidden md:flex items-center justify-center rounded-full size-10 bg-white/20 border border-white/60 backdrop-blur-md shadow-md transition-opacity duration-200 ease-out ${
          isCursorVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="size-1.5 rounded-full bg-white opacity-90" />
      </div>

      {/* ── 1. Fond Vidéo Haute Fidélité Réduit et Centré ── */}
      <div className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden z-0 bg-background flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          autoPlay={false}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover object-[50%_48%] transition-opacity duration-500 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-80'
          }`}
        />
        {/* Voile de contraste léger pour une netteté et un confort visuel optimal */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent sm:bg-black/15 md:bg-black/10 pointer-events-none" />
      </div>

      {/* ── 2. Contenu Texte Éditorial & Appels à l'action identiques au mode classique ── */}
      <Container
        width="wide"
        className="relative z-10 pt-8 pb-12 sm:py-20 lg:py-24 min-h-[calc(100svh-52px)] sm:min-h-0 flex flex-col justify-between sm:justify-center"
      >
        <div className="max-w-xl lg:max-w-2xl">
          <h1
            id="hero-heading"
            className="text-balance font-serif font-normal text-white [text-shadow:_0_2px_12px_rgba(0,0,0,0.85),_0_8px_28px_rgba(0,0,0,0.7),_0_16px_55px_rgba(0,0,0,0.55)] text-[clamp(52px,12vw,104px)] lg:text-[112px] leading-[0.98] tracking-[-0.02em]"
          >
            Créer <br />
            <span className="italic font-normal">l'impossible</span>
          </h1>

          <p className="mt-5 sm:mt-8 max-w-sm sm:max-w-md font-sans font-medium text-[15px] sm:text-base leading-[1.65] text-white/95 [text-shadow:_0_1px_8px_rgba(0,0,0,0.9),_0_4px_20px_rgba(0,0,0,0.75)]">
            On transforme vos idées les plus ambitieuses en sites web réels.
            Parce qu'«&nbsp;infaisable&nbsp;» n'est que le point de départ.
          </p>
        </div>

        {/* ── Actions Principales (même hauteur, padding et marges que le mode classique) ── */}
        <div className="mt-auto mb-3 sm:mb-0 pt-6 sm:mt-10 sm:pt-0 flex flex-col gap-3.5 sm:flex-row sm:items-center max-w-xl">
          <Button
            asChild
            size="lg"
            variant="primary"
            className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 text-[15px] shadow-md justify-center text-center group"
          >
            <Link to="/devis">
              Démarrer un projet
              <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 text-[15px] bg-surface/90 backdrop-blur-sm hover:bg-surface border-ink/20 shadow-xs justify-center text-center"
          >
            <Link to="/tarifs">Découvrir les offres</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
