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
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile } from '@/features/auth/useProfile';
import { PLATFORM_ROLE_LABELS } from '@/types/domain';
import { Logo } from '@/components/marketing/Logo';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/States';

/**
 * Espace d'administration HBG Labs (§27).
 *
 * Barre latérale sur grand écran, tiroir sur mobile (§40). Les entrées
 * correspondent toutes à un écran existant : « Abonnements » et « Facturation »
 * n'y figurent pas, leurs tables restant vides tant que Stripe n'écrit pas.
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
  { to: '/admin/tickets', label: 'Demandes clients', icon: MessageSquare },
  { to: '/admin/demandes', label: 'Prospects', icon: Inbox },
];

function NavigationList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {navigation.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end ?? false}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-surface-muted',
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
    <div className="border-t border-border p-4">
      <p className="truncate text-sm font-medium">{profile?.full_name || user?.email}</p>
      {profile?.platform_role && (
        <div className="mt-2">
          <StatusBadge
            tone="info"
            label={PLATFORM_ROLE_LABELS[profile.platform_role]}
            withDot={false}
          />
        </div>
      )}

      <div className="mt-3 space-y-1">
        <Link
          to="/dashboard"
          className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
        >
          Mon espace client
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-danger hover:bg-danger-surface"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface-muted">
      {/* ---- Barre latérale, grand écran ---- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border p-4">
          <Logo />
          <p className="mt-2 text-xs uppercase tracking-wider text-muted">
            Administration
          </p>
        </div>

        <nav aria-label="Administration" className="flex-1 overflow-y-auto p-3">
          <NavigationList />
        </nav>

        {sidebarFooter}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---- En-tête mobile ---- */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <Logo />

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Ouvrir le menu d’administration"
              >
                <Menu className="size-6" aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-xs flex-col border-r border-border bg-surface shadow-xl lg:hidden">
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                  <Dialog.Title className="text-sm font-medium text-muted">
                    Administration
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

                <Dialog.Description className="sr-only">
                  Navigation de l’espace d’administration
                </Dialog.Description>

                <nav aria-label="Administration" className="flex-1 overflow-y-auto p-3">
                  <NavigationList onNavigate={() => setOpen(false)} />
                </nav>

                {sidebarFooter}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </header>

        <main id="contenu-principal" className="min-w-0 flex-1">
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
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
