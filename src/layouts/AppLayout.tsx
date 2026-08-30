import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ChevronDown,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/auth-context';
import { useIsPlatformStaff, useProfile } from '@/features/auth/useProfile';
import { Logo } from '@/components/marketing/Logo';
import { Container } from '@/components/ui/Layout';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LoadingState } from '@/components/ui/States';

/**
 * Mise en page de l'espace connecté.
 *
 * En-tête, navigation et menu utilisateur.
 *
 * Chaque entrée mène à un écran existant : un lien vers une page inexistante
 * donne l'illusion d'une fonctionnalité livrée.
 *
 * « Facturation » réunit l'abonnement et les factures que le §15 énumère
 * séparément. Les scinder produirait deux écrans dont l'un ne porterait qu'une
 * carte, et obligerait le client à passer de l'un à l'autre pour comprendre ce
 * qui lui est prélevé.
 */
const navigation = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/dashboard/site', label: 'Mon site', icon: MonitorSmartphone, end: false },
  { to: '/dashboard/domaine', label: 'Domaine', icon: Globe, end: false },
  { to: '/dashboard/demandes', label: 'Demandes', icon: MessageSquare, end: false },
  { to: '/dashboard/facturation', label: 'Facturation', icon: CreditCard, end: false },
  { to: '/parametres', label: 'Paramètres', icon: Settings, end: false },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  // Affiche l'entrée vers l'administration au personnel HBG Labs.
  //
  // Ce lien MONTRE une entrée, il n'autorise rien. `RequirePlatformStaff`
  // filtre la route, et les policies RLS protègent les données : un client qui
  // forcerait l'URL serait redirigé, et n'obtiendrait de toute façon aucune
  // ligne.
  const isStaff = useIsPlatformStaff();
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur-md">
        <Container>
          <div className="flex h-[56px] sm:h-[64px] items-center justify-between gap-4">
            <div className="flex items-center gap-10">
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
                            'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all duration-200',
                            'hover:bg-surface-muted',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            isActive
                              ? 'bg-ink text-white font-semibold shadow-sm'
                              : 'text-ink hover:text-accent',
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

            <div className="flex items-center gap-3">
              <NotificationBell />

              {isStaff && (
                <Link
                  to="/admin"
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium',
                    'text-accent hover:bg-surface-muted hover:border-accent',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors',
                  )}
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Administration</span>
                  <span className="sr-only sm:hidden">Administration</span>
                </Link>
              )}

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm',
                    'hover:border-ink/30 transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white"
                  >
                    {initial}
                  </span>
                  <span className="hidden max-w-40 truncate font-medium text-ink sm:inline">{displayName}</span>
                  <ChevronDown className="size-4 text-muted" aria-hidden="true" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl"
                >
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                    {user?.email && (
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    )}
                  </div>

                  {/* Sur mobile, le menu porte aussi la navigation : l'en-tête
                      ne l'affiche pas en dessous de md. */}
                  <div className="md:hidden py-1">
                    {navigation.map((item) => (
                      <DropdownMenu.Item key={item.to} asChild>
                        <Link
                          to={item.to}
                          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-ink outline-none data-[highlighted]:bg-surface-muted"
                        >
                          <item.icon className="size-4" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                  </div>

                  <div className="pt-1">
                    <DropdownMenu.Item asChild>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        disabled={signingOut}
                        className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-danger outline-none data-[highlighted]:bg-danger-surface disabled:opacity-60"
                      >
                        <LogOut className="size-4" aria-hidden="true" />
                        {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
                      </button>
                    </DropdownMenu.Item>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </Container>
      </header>

      <main id="contenu-principal" className="flex-1 bg-background">
        <Suspense fallback={<LoadingState fullPage label="Chargement…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
