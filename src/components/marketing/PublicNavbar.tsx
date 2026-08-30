import { useState } from 'react';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainNav } from '@/config/navigation';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Layout';
import { useAuth } from '@/features/auth/auth-context';
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
  const { user, isLoading } = useAuth();

  const closeDrawer = () => setOpen(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-[72px] bg-transparent transition-colors duration-200">
      <Container width="wide" className="h-full">
        <nav
          className="flex h-full items-center justify-between gap-6"
          aria-label="Navigation principale"
        >
          <Logo />

          <ul className="hidden items-center gap-8 md:flex">
            {mainNav.map((item) => (
              <li key={item.to}>
                <RouterNavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-[14px] font-medium tracking-tight text-ink transition-colors duration-200 hover:text-accent',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      isActive && 'text-accent font-semibold',
                    )
                  }
                >
                  {item.label}
                </RouterNavLink>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            {!isLoading &&
              (user ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/dashboard">Mon espace</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/connexion">Connexion</Link>
                </Button>
              ))}

            <Button asChild size="sm" variant="primary">
              <Link to="/devis">Démarrer un projet</Link>
            </Button>
          </div>

          {/* ---- Tiroir mobile ---- */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full md:hidden text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-6" aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm md:hidden" />

              <Dialog.Content
                className={cn(
                  'fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col',
                  'border-l border-border bg-background shadow-2xl md:hidden',
                )}
              >
                <div className="flex h-[72px] items-center justify-between border-b border-border px-6">
                  <Logo />

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      aria-label="Fermer le menu"
                    >
                      <X className="size-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <Dialog.Description className="sr-only">
                  Menu de navigation du site
                </Dialog.Description>

                <div className="flex-1 overflow-y-auto px-6 py-8">
                  <ul className="space-y-4">
                    {mainNav.map((item) => (
                      <li key={item.to}>
                        <RouterNavLink
                          to={item.to}
                          onClick={closeDrawer}
                          className={({ isActive }) =>
                            cn(
                              'block py-2 text-lg font-medium text-ink transition-colors hover:text-accent',
                              isActive && 'text-accent font-semibold',
                            )
                          }
                        >
                          {item.label}
                        </RouterNavLink>

                        {item.children && (
                          <ul className="ml-3 mt-2 space-y-2 border-l border-border pl-4">
                            {item.children.map((child) => (
                              <li key={child.to}>
                                <RouterNavLink
                                  to={child.to}
                                  onClick={closeDrawer}
                                  className={({ isActive }) =>
                                    cn(
                                      'block py-1 text-sm text-muted hover:text-accent',
                                      isActive && 'text-accent font-medium',
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

                <div className="space-y-3 border-t border-border p-6">
                  {!isLoading &&
                    (user ? (
                      <Button asChild fullWidth variant="outline">
                        <Link to="/dashboard" onClick={closeDrawer}>
                          Mon espace
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild fullWidth variant="outline">
                        <Link to="/connexion" onClick={closeDrawer}>
                          Connexion
                        </Link>
                      </Button>
                    ))}

                  <Button asChild fullWidth variant="primary">
                    <Link to="/devis" onClick={closeDrawer}>
                      Démarrer un projet
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
