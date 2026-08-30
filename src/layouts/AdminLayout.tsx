import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Building2,
  Globe,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Receipt,
  ScrollText,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile } from '@/features/auth/useProfile';
import { PLATFORM_ROLE_LABELS } from '@/types/domain';
import { Logo } from '@/components/marketing/Logo';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LoadingState } from '@/components/ui/States';

/**
 * Espace d'administration HBG Labs (§27).
 *
 * Barre latérale sur grand écran, tiroir sur mobile (§40). Les entrées
 * correspondent toutes à un écran existant.
 *
 * « Demandes clients » désigne les tickets de support, « Prospects » les
 * formulaires du site public. Deux flux distincts, deux entrées distinctes.
 *
 * La mise en page ne vérifie aucun droit : c'est la garde `RequirePlatformStaff`
 * qui filtre l'accès, et les policies RLS qui protègent réellement les données.
 */

const navigation = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/clients', label: 'Clients', icon: Building2 },
  { to: '/admin/sites', label: 'Sites', icon: MonitorSmartphone },
  { to: '/admin/domaines', label: 'Domaines', icon: Globe },
  { to: '/admin/abonnements', label: 'Abonnements', icon: Receipt },
  { to: '/admin/tickets', label: 'Demandes clients', icon: MessageSquare },
  { to: '/admin/demandes', label: 'Prospects', icon: Inbox },
  { to: '/admin/journal', label: 'Journal', icon: ScrollText },
];

function NavigationList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1.5">
      {navigation.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end ?? false}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex min-h-10 items-center gap-3 rounded-full px-4 text-sm font-medium transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isActive
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink hover:bg-surface-muted hover:text-accent',
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const sidebarFooter = (
    <div className="border-t border-border p-5">
      <p className="truncate text-sm font-semibold text-ink">{profile?.full_name || user?.email}</p>
      {profile?.platform_role && (
        <div className="mt-2">
          <StatusBadge
            tone="info"
            label={PLATFORM_ROLE_LABELS[profile.platform_role]}
            withDot={false}
          />
        </div>
      )}

      <div className="mt-4 space-y-1">
        <Link
          to="/dashboard"
          className="flex min-h-10 items-center rounded-lg px-3 text-sm text-muted hover:bg-surface-muted hover:text-ink transition-colors"
        >
          Mon espace client
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-danger hover:bg-danger-surface transition-colors"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---- Barre latérale, grand écran ---- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Logo />
              <p className="mt-2 font-sans text-[11px] font-semibold uppercase tracking-wider text-accent">
                Administration
              </p>
            </div>

            <NotificationBell align="start" />
          </div>
        </div>

        <nav aria-label="Administration" className="flex-1 overflow-y-auto p-4">
          <NavigationList />
        </nav>

        {sidebarFooter}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---- En-tête mobile ---- */}
        <header className="flex h-[56px] sm:h-[64px] items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:hidden">
          <Logo />

          <div className="flex items-center gap-2">
            <NotificationBell />

            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label="Ouvrir le menu d’administration"
                >
                  <Menu className="size-6" aria-hidden="true" />
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-xs flex-col border-r border-border bg-surface shadow-2xl lg:hidden">
                  <div className="flex h-[72px] items-center justify-between border-b border-border px-6">
                    <Dialog.Title className="text-sm font-semibold uppercase tracking-wider text-accent">
                      Administration
                    </Dialog.Title>
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
                    Navigation de l’espace d’administration
                  </Dialog.Description>

                  <nav aria-label="Administration" className="flex-1 overflow-y-auto p-4">
                    <NavigationList onNavigate={() => setOpen(false)} />
                  </nav>

                  {sidebarFooter}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </header>

        <main id="contenu-principal" className="min-w-0 flex-1 bg-background">
          <Suspense fallback={<LoadingState fullPage label="Chargement…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

/** En-tête de page d'administration, avec action principale optionnelle. */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 font-sans text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
