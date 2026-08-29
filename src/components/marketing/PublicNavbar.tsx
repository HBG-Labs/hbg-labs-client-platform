import { useState } from 'react';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainNav } from '@/config/navigation';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Layout';
import { Logo } from './Logo';

/**
 * Barre de navigation du site public.
 *
 * Sur mobile, le menu devient un tiroir latéral (§40). Radix Dialog fournit le
 * piège de focus, la fermeture par Échap, le blocage du défilement d'arrière
 * plan et les attributs ARIA. Réécrire cela à la main donne presque toujours
 * un tiroir dont on sort au clavier sans le fermer.
 *
 * Sur grand écran la navigation reste plate : les trois pages de services sont
 * accessibles depuis `/services` et le pied de page. Un menu déroulant au
 * survol pose des problèmes d'accessibilité réels pour trois liens.
 */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  // Le tiroir se ferme au clic sur un lien, pas depuis un effet observant
  // l'URL. Fermer depuis un effet provoquerait un rendu en cascade après
  // chaque navigation, y compris quand le tiroir est déjà fermé.
  const closeDrawer = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container>
        <nav className="flex h-16 items-center justify-between gap-4" aria-label="Navigation principale">
          <Logo />

          <ul className="hidden items-center gap-1 md:flex">
            {mainNav.map((item) => (
              <li key={item.to}>
                <RouterNavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                      'hover:bg-surface-muted',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      isActive ? 'text-primary' : 'text-foreground',
                    )
                  }
                >
                  {item.label}
                </RouterNavLink>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild size="sm">
              <Link to="/devis">Demander un devis</Link>
            </Button>
          </div>

          {/* ---- Tiroir mobile ---- */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-md md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-6" aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />

              <Dialog.Content
                className={cn(
                  'fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col',
                  'border-l border-border bg-background shadow-xl md:hidden',
                )}
              >
                <div className="flex h-16 items-center justify-between border-b border-border px-5">
                  <Dialog.Title className="text-sm font-medium text-muted">
                    Navigation
                  </Dialog.Title>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="inline-flex size-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      aria-label="Fermer le menu"
                    >
                      <X className="size-6" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Description exigée par Radix pour l'annonce vocale du dialogue. */}
                <Dialog.Description className="sr-only">
                  Menu de navigation du site
                </Dialog.Description>

                <div className="flex-1 overflow-y-auto p-5">
                  <ul className="space-y-1">
                    {mainNav.map((item) => (
                      <li key={item.to}>
                        <RouterNavLink
                          to={item.to}
                          onClick={closeDrawer}
                          className={({ isActive }) =>
                            cn(
                              'flex min-h-11 items-center rounded-md px-3 font-medium',
                              'hover:bg-surface-muted',
                              isActive && 'text-primary',
                            )
                          }
                        >
                          {item.label}
                        </RouterNavLink>

                        {item.children && (
                          <ul className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                            {item.children.map((child) => (
                              <li key={child.to}>
                                <RouterNavLink
                                  to={child.to}
                                  onClick={closeDrawer}
                                  className={({ isActive }) =>
                                    cn(
                                      'flex min-h-11 items-center rounded-md px-3 text-sm',
                                      'text-muted hover:bg-surface-muted hover:text-foreground',
                                      isActive && 'text-primary',
                                    )
                                  }
                                >
                                  {child.label}
                                </RouterNavLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border p-5">
                  <Button asChild fullWidth>
                    <Link to="/devis" onClick={closeDrawer}>
                      Demander un devis
                    </Link>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </nav>
      </Container>
    </header>
  );
}
