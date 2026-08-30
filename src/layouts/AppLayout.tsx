import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ChevronDown,
  Globe,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile } from '@/features/auth/useProfile';
import { Logo } from '@/components/marketing/Logo';
import { Container } from '@/components/ui/Layout';
import { LoadingState } from '@/components/ui/States';

/**
 * Mise en page de l'espace connecté.
 *
 * En-tête, navigation et menu utilisateur. Les rubriques Abonnement,
 * Facturation et Demandes du §15 apparaîtront avec les écrans qu'elles
 * desservent : un lien vers une page inexistante donne l'illusion d'une
 * fonctionnalité livrée.
 */

// Chaque entree mene a un ecran existant. Les rubriques Abonnement,
// Facturation et Demandes du §15 apparaitront avec les ecrans qu'elles
// desservent : un lien vers une page absente donne l'illusion d'une
// fonctionnalite livree.
const navigation = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/dashboard/site', label: 'Mon site', icon: MonitorSmartphone, end: false },
  { to: '/dashboard/domaine', label: 'Domaine', icon: Globe, end: false },
  { to: '/parametres', label: 'Paramètres', icon: Settings, end: false },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = profile?.full_name || user?.email || 'Mon compte';
  const initial = displayName.trim().charAt(0).toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Logo />

              <nav aria-label="Espace client" className="hidden md:block">
                <ul className="flex items-center gap-1">
                  {navigation.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                            'hover:bg-surface-muted',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            isActive ? 'text-primary' : 'text-foreground',
                          )
                        }
                      >
                        <item.icon className="size-4" aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm',
                    'hover:bg-surface-muted',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                  >
                    {initial}
                  </span>
                  <span className="hidden max-w-40 truncate sm:inline">{displayName}</span>
                  <ChevronDown className="size-4 text-muted" aria-hidden="true" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-56 rounded-lg border border-border bg-surface p-1.5 shadow-lg"
                >
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {user?.email && (
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    )}
                  </div>

                  {/* Sur mobile, le menu porte aussi la navigation : l'en-tête
                      ne l'affiche pas en dessous de md. */}
                  <div className="md:hidden">
                    {navigation.map((item) => (
                      <DropdownMenu.Item key={item.to} asChild>
                        <Link
                          to={item.to}
                          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm outline-none data-[highlighted]:bg-surface-muted"
                        >
                          <item.icon className="size-4" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                  </div>

                  <DropdownMenu.Item asChild>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      disabled={signingOut}
                      className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-sm text-danger outline-none data-[highlighted]:bg-danger-surface disabled:opacity-60"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </Container>
      </header>

      <main id="contenu-principal" className="flex-1 bg-surface-muted">
        <Suspense fallback={<LoadingState fullPage label="Chargement…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
