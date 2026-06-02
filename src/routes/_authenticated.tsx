import {
  createFileRoute,
  redirect,
  Outlet,
  Link,
  useRouterState,
  useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import { tv } from 'tailwind-variants';
import { Toaster } from 'sonner';
import { useAuthStore } from '../features/auth/store';
import { useCurrentUser, useLogout } from '../features/auth/api';
import { Button } from '../shared/components/Button';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

// ─── Nav item styling ─────────────────────────────────────────────────────────

const navItem = tv({
  base: 'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
  variants: {
    active: {
      true: 'bg-surface-alt text-cream border-l-2 border-primary pl-[10px]',
      false: 'text-cream/60 hover:bg-surface-alt hover:text-cream',
    },
  },
  defaultVariants: { active: false },
});

const navSection = tv({
  base: 'px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-cream/30',
});

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavLinkItem {
  label: string;
  to: string;
}

const primaryNav: NavLinkItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Hunters', to: '/hunters' },
  { label: 'Campaigns', to: '/campaigns' },
  { label: 'Quests', to: '/quests' },
];

const catalogNav: NavLinkItem[] = [
  { label: 'Monsters', to: '/catalog/monsters' },
  { label: 'Materials', to: '/catalog/materials' },
  { label: 'Weapons', to: '/catalog/weapons' },
  { label: 'Equipment', to: '/catalog/equipment' },
  { label: 'Maps', to: '/maps' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ label, to, onNavigate }: NavLinkItem & { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to as never}
      onClick={onNavigate}
      className={navItem({ active: isActive })}
    >
      {label}
    </Link>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
  onCollapse?: () => void;
}

function SidebarContent({ onNavigate, onCollapse }: SidebarProps) {
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-surface-alt/40">
        <span className="text-xs font-black uppercase tracking-widest text-cream">
          Monster Hunter
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {primaryNav.map((item) => (
          <NavLink key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        <p className={navSection()}>Catalog</p>

        {catalogNav.map((item) => (
          <NavLink key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Collapse button — desktop only */}
      {onCollapse && (
        <div className="sticky bottom-0 border-t border-surface-alt/40 bg-background p-2">
          <button
            onClick={onCollapse}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-cream/40 transition-colors hover:bg-surface-alt hover:text-cream"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
            Collapse
          </button>
        </div>
      )}
    </>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

interface TopBarProps {
  onMenuToggle: () => void;
}

function TopBar({ onMenuToggle }: TopBarProps) {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-primary/15 bg-surface-alt px-4">
      {/* Hamburger — visible on mobile/tablet only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center rounded-md p-1.5 text-muted hover:bg-surface hover:text-cream transition-colors"
        aria-label="Toggle menu"
      >
        <HamburgerIcon />
      </button>

      {/* Welcome — hidden on mobile to save space */}
      <span className="hidden sm:block text-sm text-muted">
        {user ? (
          <>
            Welcome back,{' '}
            <span className="font-medium text-cream">{user.name}</span>
          </>
        ) : null}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/login' }) })}
        loading={logout.isPending}
      >
        Log out
      </Button>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function AuthenticatedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className={['hidden lg:flex shrink-0 flex-col bg-background border-r border-surface-alt/40 min-h-screen transition-[width] duration-200', desktopCollapsed ? 'w-12' : 'w-52'].join(' ')}>
        {desktopCollapsed ? (
          <div className="flex flex-1 flex-col items-center pt-3">
            <button
              onClick={() => setDesktopCollapsed(false)}
              className="rounded-md p-2 text-cream/40 transition-colors hover:bg-surface-alt hover:text-cream"
              aria-label="Expand sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <SidebarContent onCollapse={() => setDesktopCollapsed(true)} />
        )}
      </aside>

      {/* ── Mobile/tablet drawer ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-52 flex-col bg-background border-r border-surface-alt/40">
            <SidebarContent onNavigate={closeMobile} />
          </aside>
        </div>
      )}

      {/* ── Main column ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuToggle={() => setMobileOpen((o) => !o)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2a2416',
            border: '1px solid rgba(200,149,42,0.2)',
            color: '#f0e3c0',
          },
        }}
      />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
